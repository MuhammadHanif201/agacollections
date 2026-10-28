import { str, type FormInput } from '@/lib/admin/form';

const base = {
  title_en: 'nullable|string|max:255',
  subtitle: 'nullable|string|max:255',
  link: 'nullable|url|max:500',
  button_text: 'nullable|string|max:100',
  media_type: 'required|in:image,video',
  position: 'required|integer|min:1',
  status: 'required|in:active,inactive',
};

/** SliderController::store rules */
export const storeRules = (input: FormInput) =>
  (str(input, 'media_type') ?? 'image') === 'video'
    ? { ...base, video: 'required|file|mimes:mp4,webm,ogg|max:51200' }
    : { ...base, image: 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096' };

/** SliderController::update rules */
export const updateRules = { ...base, image: 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096', video: 'nullable|file|mimes:mp4,webm,ogg|max:51200' };
