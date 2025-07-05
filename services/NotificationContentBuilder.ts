import * as Notifications from 'expo-notifications';
// Using the actual module for runtime, but we avoid relying on its typings to
// keep the project compiling even if the package's TypeScript defs are out of
// date. We therefore fall back to `any` in a couple of places below.

// ----------------------------------------------------------------------------
// NotificationContentBuilder
// ----------------------------------------------------------------------------
//  This small helper centralises how we construct the local-notification
//  payload for brushing reminders. All hard-coded strings live here so it's
//  easy to translate or personalise them in the future.
//
//  Update the templates below with your final copy – or replace the builder
//  altogether if you need something more sophisticated (e.g. i18n lookup).
// ----------------------------------------------------------------------------

export interface ContentBuilderOptions {
  /** Current user's preferred display name, if you have one */
  username?: string;
}

// Basic templates grouped by time of day. Feel free to rename / expand.
// Each template may include the following placeholders:
//   {username}   – Will be replaced with the user's name (or left out)
//   {label}      – The reminder's label ("Morning", "Night" …)
//   {time}       – The raw HH:mm string of the reminder
const TEXT_TEMPLATES = {
  default: {
    title: `Time to brush! 🪥`,
    body: `It's brushing time – keep your smile shining!`,
  },
  morning: {
    title: `Good morning{username}! 🪥`,
    body: `Start your day fresh with a quick brush.`,
  },
  afternoon: {
    title: `Quick afternoon brush{username}?`,
    body: `A clean smile powers you through the rest of the day!`,
  },
  evening: {
    title: `Evening brush routine`,
    body: `Wind down with a refreshing brush.`,
  },
  night: {
    title: `Bedtime brush reminder`,
    body: `Don't forget to brush before you sleep.`,
  },
} as const;

// Optional attachment image per template (iOS / some Android flavours).
// Supply a local asset or remote URL.
const IMAGE_TEMPLATES: Partial<Record<keyof typeof TEXT_TEMPLATES, string>> = {
  // night: require('../assets/images/night-brush.png'),
  // morning: 'https://…/morning.png',
};

function applyTemplate(
  raw: string,
  vars: Record<string, string | undefined>
): string {
  return raw.replace(/\{(.*?)\}/g, (_, key: string) => vars[key] ?? '');
}

export function buildNotificationContent(
  label: string,
  time: string,
  options: ContentBuilderOptions = {}
): any {
  // Determine which template bucket we fall into based on hour.
  const hour = Number(time.split(':')[0]);
  let bucket: keyof typeof TEXT_TEMPLATES = 'default';
  if (hour >= 5 && hour < 12) bucket = 'morning';
  else if (hour >= 12 && hour < 17) bucket = 'afternoon';
  else if (hour >= 17 && hour < 22) bucket = 'evening';
  else bucket = 'night';

  const template = TEXT_TEMPLATES[bucket] ?? TEXT_TEMPLATES.default;
  const vars = {
    username: options.username ? `, ${options.username}` : '',
    label,
    time,
  } as const;

  const content: any = {
    title: applyTemplate(template.title, vars),
    body: applyTemplate(template.body, vars),
    sound: true,
  };

  // Attach an image if configured.
  const image = IMAGE_TEMPLATES[bucket];
  if (image) {
    // iOS & Android (Expo) both accept the `attachments` array.
    // Some Android manufacturers ignore it – test on target devices.
    // @ts-ignore – typings may not expose `attachments` in older versions.
    content.attachments = [
      {
        identifier: 'brush-art',
        url: typeof image === 'string' ? image : undefined,
        // `uri` for remote? But Expo handles url fine for local require.
      } as any,
    ];
  }

  return content;
} 