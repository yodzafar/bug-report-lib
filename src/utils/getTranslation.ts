import { en } from "../locale/en"
import { ru } from "../locale/ru"
import { uz } from "../locale/uz"
import { uzCiril } from "../locale/uz_ciril"

export const getTranslations = (
  locale?: "uz" | "ru" | "en" | "o'z"
): ((key: string) => string) => {
  let translations: Record<string, string> = {}
  switch (locale) {
    case "uz":
      translations = uzCiril
      break
    case "o'z":
      translations = uz
      break
    case "en":
      translations = en
      break
    case "ru":
      translations = ru
    default:
      translations = ru
  }

  return (key: string): string => {
    return translations[key] || key
  }
}
