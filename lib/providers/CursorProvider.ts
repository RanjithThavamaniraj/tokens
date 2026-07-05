import { BaseProvider, type ProviderId } from "@/lib/providers/Provider";

export class CursorProvider extends BaseProvider {
  readonly id: ProviderId = "cursor";
  readonly name = "Cursor";
}
