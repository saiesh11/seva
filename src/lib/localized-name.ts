type Localizable = {
  name_en: string;
  name_te?: string | null;
  name_hi?: string | null;
};

export function localizedName(item: Localizable, language: string): string {
  if (language === 'te' && item.name_te) return item.name_te;
  if (language === 'hi' && item.name_hi) return item.name_hi;
  return item.name_en;
}
