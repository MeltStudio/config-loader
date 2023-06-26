import { OptionErrors } from "@/option";
import type { IOptionErrors } from "@/option/errors";
import Settings from "@/settings";

import container from "./injector";
import { diTokens } from "./tokens";

container
  .bind<IOptionErrors>(diTokens.OptionErrors)
  .to(OptionErrors)
  .inSingletonScope();
container.bind(diTokens.Settings).to(Settings);
