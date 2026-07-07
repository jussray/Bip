export const CONTROL_ROOM_OPERATIONS = {
  projectName: "Se'kret Bip",
  repository: 'jussray/Bip',
  repositoryUrl: 'https://github.com/jussray/Bip',
  founderNotificationEmail: 'sekretbip@gmail.com',
  mission: 'Ship Bip without being blocked by a single provider, quota, or hosted runner.',
  defaultAgentUrl:
    process.env.EXPO_PUBLIC_CONTROL_ROOM_AGENT_URL?.trim() || 'http://127.0.0.1:4317',
  agentToken: process.env.EXPO_PUBLIC_CONTROL_ROOM_AGENT_TOKEN?.trim() || '',
} as const;
