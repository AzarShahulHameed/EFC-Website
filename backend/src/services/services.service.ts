import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LanguagesService } from '../languages/languages.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceTranslationDto } from './dto/service-translation.dto';
import { CreateSubServiceDto, SubServiceTranslationDto, UpdateSubServiceDto } from './dto/sub-service.dto';

// Which ServiceTranslation fields are rich HTML (from RichTextField) rather
// than plain text — same distinction translateBatch() needs to pick
// format:"html" vs format:"text" per field. `faqs` is deliberately left out
// of auto-translation below — it's a structured question/answer list, not a
// flat field, and an admin reviewing/writing FAQs by hand per language is
// the safer default for now.
const SERVICE_HTML_FIELDS = ['description', 'whatIsIt', 'whoNeedsIt'];

// Prisma's `Json?` column wants `Prisma.InputJsonValue | Prisma.JsonNull`,
// not the plain typed array class-validator gives us — same cast pattern
// as theme.service.ts/seo.service.ts/languages.service.ts.
function toPrismaTranslation(t: ServiceTranslationDto) {
  return {
    ...t,
    faqs: (t.faqs as unknown as Prisma.InputJsonValue) ?? undefined,
  };
}

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private languagesService: LanguagesService,
  ) {}

  // Public: only active services, in one language, shaped flat for the frontend.
  async findAllPublic(languageCode = 'en') {
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      // Fetch the requested language plus English, so a service that
      // hasn't been translated yet still renders (in English) instead of
      // coming back with blank title/summary/description.
      include: {
        translations: { where: { languageCode: { in: [languageCode, 'en'] } } },
        subServices: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: { translations: { where: { languageCode } } },
        },
      },
    });
    return services.map((s) => this.flatten(s, languageCode));
  }

  async findOnePublic(slug: string, languageCode = 'en') {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        translations: { where: { languageCode: { in: [languageCode, 'en'] } } },
        responsiblePerson: { include: { translations: { where: { languageCode: { in: [languageCode, 'en'] } } } } },
        subServices: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            translations: { where: { languageCode } },
            responsiblePerson: { include: { translations: { where: { languageCode: { in: [languageCode, 'en'] } } } } },
          },
        },
      },
    });
    if (!service || !service.isActive) throw new NotFoundException('Service not found.');
    return this.flatten(service, languageCode);
  }

  // Admin: every language, every field, active or not. Includes each
  // service's sub-services (with their own translations) so the frontend's
  // bulk-translate feature can walk every sub-service without an extra
  // round trip per service.
  findAllAdmin() {
    return this.prisma.service.findMany({
      orderBy: { order: 'asc' },
      include: { translations: true, category: true, subServices: { include: { translations: true } } },
    });
  }

  async findOneAdmin(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        translations: true,
        category: true,
        responsiblePerson: true,
        subServices: { orderBy: { order: 'asc' }, include: { responsiblePerson: true, translations: true } },
      },
    });
    if (!service) throw new NotFoundException('Service not found.');
    return service;
  }

  // --- Sub-services ---

  async createSubService(serviceId: string, dto: CreateSubServiceDto) {
    await this.findOneAdmin(serviceId);
    return this.prisma.subService.create({
      data: {
        serviceId,
        name: dto.name,
        slug: dto.slug || undefined,
        description: dto.description,
        body: dto.body,
        imageUrl: dto.imageUrl,
        imagePosition: dto.imagePosition ?? 'center',
        videoUrl: dto.videoUrl,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        whatIsIt: dto.whatIsIt,
        whoNeedsIt: dto.whoNeedsIt,
        benefits: dto.benefits,
        process: dto.process,
        costFactors: dto.costFactors,
        timeline: dto.timeline,
        faqs: (dto.faqs as unknown as Prisma.InputJsonValue) ?? undefined,
        responsiblePersonId: dto.responsiblePersonId || null,
      },
    });
  }

  async updateSubService(id: string, dto: UpdateSubServiceDto) {
    const existing = await this.prisma.subService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sub-service not found.');
    const { translations, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (translations) {
        for (const t of translations) {
          const data = { ...t, faqs: (t.faqs as unknown as Prisma.InputJsonValue) ?? undefined };
          await tx.subServiceTranslation.upsert({
            where: { subServiceId_languageCode: { subServiceId: id, languageCode: t.languageCode } },
            update: data,
            create: { ...data, subServiceId: id },
          });
        }
      }
      return tx.subService.update({
        where: { id },
        data: {
          ...rest,
          faqs: (rest.faqs as unknown as Prisma.InputJsonValue) ?? undefined,
          responsiblePersonId: rest.responsiblePersonId === undefined ? undefined : rest.responsiblePersonId || null,
        },
        include: { translations: true },
      });
    });
  }

  async removeSubService(id: string) {
    const existing = await this.prisma.subService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sub-service not found.');
    await this.prisma.subService.delete({ where: { id } });
    return { deleted: true };
  }

  // `slug` is the service's URL and has to be unique across every service
  // (see schema.prisma) — two services can't both be "/services/audit".
  // Without catching it, a duplicate slug bubbles up as a raw Prisma
  // "Unique constraint failed" 500, which the admin dashboard shows as a
  // generic "something went wrong" with no indication of what to fix.
  // Same handling on update() below, since renaming a slug to one another
  // service already uses hits the same constraint.
  async create(dto: CreateServiceDto) {
    try {
      return await this.prisma.service.create({
        data: {
          slug: dto.slug,
          categoryId: dto.categoryId,
          iconKey: dto.iconKey,
          brochureUrl: dto.brochureUrl,
          imageUrl: dto.imageUrl,
          imagePosition: dto.imagePosition ?? 'center',
          responsiblePersonId: dto.responsiblePersonId || null,
          isActive: dto.isActive ?? true,
          order: dto.order ?? 0,
          translations: { create: dto.translations.map(toPrismaTranslation) },
        },
        include: { translations: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `A service with the slug "${dto.slug}" already exists — choose a different slug (or edit that existing service instead).`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOneAdmin(id);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.translations) {
          for (const raw of dto.translations) {
            const t = toPrismaTranslation(raw);
            await tx.serviceTranslation.upsert({
              where: { serviceId_languageCode: { serviceId: id, languageCode: t.languageCode } },
              update: t,
              create: { ...t, serviceId: id },
            });
          }
        }

        return tx.service.update({
          where: { id },
          data: {
            slug: dto.slug,
            categoryId: dto.categoryId,
            iconKey: dto.iconKey,
            brochureUrl: dto.brochureUrl,
            imageUrl: dto.imageUrl,
            imagePosition: dto.imagePosition,
            responsiblePersonId: dto.responsiblePersonId === undefined ? undefined : dto.responsiblePersonId || null,
            isActive: dto.isActive,
            order: dto.order,
          },
          include: { translations: true },
        });
      });

      // Auto-translate: the moment an English translation is saved, fill in
      // every other active language that has NO translation row at all yet
      // — never one that already exists, whether an admin wrote it by hand
      // or it was auto-filled before, so this can never clobber a reviewed
      // edit. Fire-and-forget (not awaited) and fully best-effort: a
      // missing API key or a Google API error must never turn a successful
      // content save into a failed request.
      const savedEn = dto.translations?.find((t) => t.languageCode === 'en');
      if (savedEn) {
        this.autoFillMissingTranslations(id, savedEn).catch(() => undefined);
      }

      return updated;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `A service with the slug "${dto.slug}" already exists — choose a different slug.`,
        );
      }
      throw err;
    }
  }

  // See update()'s call site above for the "never overwrite" rule this
  // enforces. `en` is the just-saved English translation payload (not a
  // fresh DB read) so this reflects exactly what the admin just submitted,
  // even before the transaction's write is visible to a subsequent read.
  private async autoFillMissingTranslations(serviceId: string, en: ServiceTranslationDto) {
    const [languages, existingTranslations] = await Promise.all([
      this.prisma.language.findMany({ where: { isActive: true, code: { not: 'en' } } }),
      this.prisma.serviceTranslation.findMany({ where: { serviceId } }),
    ]);
    if (languages.length === 0) return;

    const texts: Record<string, string> = {
      title: en.title || '',
      summary: en.summary || '',
      description: en.description || '',
      whatIsIt: en.whatIsIt || '',
      whoNeedsIt: en.whoNeedsIt || '',
      costFactors: en.costFactors || '',
      timeline: en.timeline || '',
      benefits: en.benefits || '',
      process: en.process || '',
    };

    for (const lang of languages) {
      const already = existingTranslations.find((t) => t.languageCode === lang.code);
      // "Has a translation" means has a title — a row can exist with just a
      // languageCode and nothing else if something else (a chart or seed
      // script) pre-created it, and that's still worth auto-filling.
      if (already?.title) continue;
      try {
        const translated = await this.languagesService.translateBatch(texts, lang.code, SERVICE_HTML_FIELDS, 'auto-on-save');
        if (Object.keys(translated).length === 0) continue;
        await this.prisma.serviceTranslation.upsert({
          where: { serviceId_languageCode: { serviceId, languageCode: lang.code } },
          update: translated,
          // `translateBatch`'s return type is a loose `Record<string, string>`
          // (it can legitimately come back `{}` if every field was blank),
          // so TypeScript can't statically see that `title`/`summary`/
          // `description` — the three non-nullable columns on this model —
          // are present just from spreading `translated`. Naming them
          // explicitly (falling back to the untranslated English text if
          // Google's response happened to omit one) satisfies Prisma's
          // required-field typing without changing behavior: every key
          // `translated` did return still overwrites its English fallback.
          create: {
            serviceId,
            languageCode: lang.code,
            title: translated.title ?? texts.title,
            summary: translated.summary ?? texts.summary,
            description: translated.description ?? texts.description,
            ...translated,
          },
        });
      } catch {
        // Best-effort per language — one language failing (or the API key
        // simply not being configured yet) shouldn't stop the others.
      }
    }
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  private flatten(service: any, languageCode = 'en') {
    // Prefer the requested language; fall back to English (or whatever
    // translation exists) rather than leaving fields blank.
    const t =
      service.translations.find((tr: any) => tr.languageCode === languageCode) ??
      service.translations.find((tr: any) => tr.languageCode === 'en') ??
      service.translations[0];
    const rp = service.responsiblePerson;
    const rpT = rp?.translations
      ? rp.translations.find((tr: any) => tr.languageCode === languageCode) ??
        rp.translations.find((tr: any) => tr.languageCode === 'en') ??
        rp.translations[0]
      : null;
    return {
      slug: service.slug,
      iconKey: service.iconKey,
      brochureUrl: service.brochureUrl,
      imageUrl: service.imageUrl,
      imagePosition: service.imagePosition ?? 'center',
      order: service.order,
      subServices: (service.subServices ?? []).map((ss: any) => {
        const ssRp = ss.responsiblePerson;
        const ssRpT = ssRp?.translations
          ? ssRp.translations.find((tr: any) => tr.languageCode === languageCode) ??
            ssRp.translations.find((tr: any) => tr.languageCode === 'en') ??
            ssRp.translations[0]
          : null;
        // The columns on SubService itself are the English/default text —
        // for any other language, overlay the matching SubServiceTranslation
        // row field-by-field (a sub-service that's only partially translated,
        // or not translated at all yet, still renders complete English text
        // for whatever wasn't overridden, same reasoning as FreezoneApproval).
        const ssT = languageCode === 'en' ? undefined : ss.translations?.find((tr: any) => tr.languageCode === languageCode);
        return {
          id: ss.id,
          name: ssT?.name || ss.name,
          slug: ss.slug,
          description: ssT?.description || ss.description,
          body: ssT?.body || ss.body,
          imageUrl: ss.imageUrl,
          imagePosition: ss.imagePosition ?? 'center',
          videoUrl: ss.videoUrl,
          order: ss.order,
          metaTitle: ssT?.metaTitle || ss.metaTitle,
          metaDescription: ssT?.metaDescription || ss.metaDescription,
          whatIsIt: ssT?.whatIsIt || ss.whatIsIt,
          whoNeedsIt: ssT?.whoNeedsIt || ss.whoNeedsIt,
          benefits: ssT?.benefits || ss.benefits,
          process: ssT?.process || ss.process,
          costFactors: ssT?.costFactors || ss.costFactors,
          timeline: ssT?.timeline || ss.timeline,
          faqs: (ssT?.faqs as any) ?? ss.faqs ?? [],
          responsiblePerson: ssRp
            ? {
                id: ssRp.id,
                name: ssRp.name,
                photoUrl: ssRp.photoUrl,
                photoPosition: ssRp.photoPosition,
                linkedinUrl: ssRp.linkedinUrl,
                email: ssRp.email,
                phone: ssRp.phone,
                position: ssRpT?.position,
              }
            : null,
        };
      }),
      title: t?.title,
      summary: t?.summary,
      description: t?.description,
      metaTitle: t?.metaTitle,
      metaDescription: t?.metaDescription,
      whatIsIt: t?.whatIsIt,
      whoNeedsIt: t?.whoNeedsIt,
      benefits: t?.benefits,
      process: t?.process,
      costFactors: t?.costFactors,
      timeline: t?.timeline,
      faqs: t?.faqs ?? [],
      responsiblePerson: rp
        ? {
            id: rp.id,
            name: rp.name,
            photoUrl: rp.photoUrl,
            photoPosition: rp.photoPosition,
            linkedinUrl: rp.linkedinUrl,
            email: rp.email,
            phone: rp.phone,
            position: rpT?.position,
          }
        : null,
    };
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.service.update({ where: { id }, data: { order: index } })),
    );
    return { reordered: ids.length };
  }
}
