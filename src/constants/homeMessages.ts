/**
 * HOME_MESSAGES
 * Rotating ambient messages shown on the dashboard/home screen.
 * Balanced spectrum: hardship wisdom AND positive energy — Se'kret Bip holds both.
 */
export const HOME_MESSAGES: string[] = [
  // — positive energy —
  "Something good is building in you right now.",
  "Your wins count. Even the tiny ones.",
  "You're allowed to be proud of yourself today.",
  "Knowing better IS the power.",
  "You showed up. That's never nothing.",
  "Joy and hardship live in the same house. Welcome both.",
  "Good things are happening too. Stay open to them.",
  "The version of you that gets through this? Already in there.",
  "Energy is contagious. Protect yours. Share the good kind.",
  "Some days you carry light instead of weight. This can be one.",
  // — soft support —
  "Don't stay up carrying the whole world tonight.",
  "Rest is productive too.",
  "You deserve softness too.",
  "Heavy days do not define you.",
  "Your mind deserves rest.",
  "Breathe slowly tonight.",
  "You made it through today.",
  "Hard feelings move through. You don't have to hold them forever.",
  "You're not behind. You're right where you need to be.",
  "It's okay to not have it all figured out.",
];

/** Returns the message at the given index, wrapping around safely */
export function getHomeMessage(index: number): string {
  return HOME_MESSAGES[index % HOME_MESSAGES.length];
}
