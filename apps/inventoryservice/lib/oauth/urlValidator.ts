// Deep import on purpose: the package index re-exports its NestJS module,
// guards and session middleware, which webpack then tries to bundle
// (`@nestjs/microservices`, `express-session`, …) and `next build` fails.
// The validator util itself has no dependencies.
import { QuestionProUrlValidatorUtil } from "@npm-questionpro/questionpro-global-oauth/lib/utils/QuestionProUrlValidatorUtil";

export function validateQpHost(url: string | undefined): boolean {
  return QuestionProUrlValidatorUtil.isValidQuestionProUrl(url);
}
