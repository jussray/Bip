import * as FileSystem from 'expo-file-system';
import { getSupabase } from '../../src/utils/supabase';

export interface AudioUploadResult {
  publicUrl: string;
  storagePath: string;
}

/**
 * Uploads a local audio file to Supabase Storage.
 * Bucket: 'voice-entries' with RLS enforcing user ownership.
 * Returns the public URL and storage path on success.
 */
export async function uploadAudioToSupabase(
  localUri: string,
  userId: string,
  context: 'pages' | 'voice_bip' | 'circle' | 'bridge'
): Promise<AudioUploadResult> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured. Audio upload unavailable.');

  const filename = `${userId}/${context}/${Date.now()}.m4a`;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([byteArray], { type: 'audio/m4a' });

  const { data, error } = await supabase.storage
    .from('voice-entries')
    .upload(filename, blob, {
      contentType: 'audio/m4a',
      upsert: false,
    });

  if (error) throw new Error(`Audio upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('voice-entries')
    .getPublicUrl(data.path);

  return {
    publicUrl: urlData.publicUrl,
    storagePath: data.path,
  };
}

/**
 * Deletes an uploaded audio file from Supabase Storage.
 */
export async function deleteAudioFromSupabase(storagePath: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured. Audio delete unavailable.');

  const { error } = await supabase.storage
    .from('voice-entries')
    .remove([storagePath]);
  if (error) throw new Error(`Audio delete failed: ${error.message}`);
}
