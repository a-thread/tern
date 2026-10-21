import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

import {
  exportFileName,
  type TernExport,
} from '@/domain/settings/models/ternExport';

/**
 * Hands an export to the phone's share sheet as a .json file, so it can be saved to Files or
 * Drive and restored from later. Where sharing files isn't possible, it falls back to text.
 */
export async function shareExport(copy: TernExport): Promise<void> {
  const json = JSON.stringify(copy, null, 2);
  if (!(await Sharing.isAvailableAsync())) {
    await Share.share({ title: 'Tern data', message: json });
    return;
  }
  const file = new File(Paths.cache, exportFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Tern data',
  });
}

/** Lets the person choose an export to restore from; null when they back out. */
export async function pickExport(): Promise<string | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    // Some file apps label JSON as plain text or as nothing in particular.
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets.length) return null;
  return new File(picked.assets[0].uri).text();
}
