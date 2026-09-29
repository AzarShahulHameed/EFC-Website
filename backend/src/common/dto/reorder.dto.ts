import { ArrayMinSize, IsArray, IsString } from 'class-validator';

// Shared by every module's bulk drag-and-drop reorder endpoint (Team,
// Testimonials, Client Logos, Branches, Services): the admin UI sends the
// full list of IDs in their new display order after a drag-and-drop, and
// the service sets each row's `order` to its index in this array.
export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
