import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform, Share } from 'react-native';

import {
  exportFileName,
  type TernExport,
} from '@/domain/settings/models/ternExport';

/** How an export left the app. */
export enum ExportOutcome {
  /** Written to a folder the person chose: `savedAs` names the file. */
  Saved = 'saved',
  /** Handed to the share sheet, which says nothing about where it went. */
  Shared = 'shared',
  /** The person backed out of choosing a folder. */
  Cancelled = 'cancelled',
}

/**
 * Saves an export as a .json file the person can keep and restore from later.
 *
 * On Android, it asks for a folder (Downloads, Documents, Google Drive…) with the system's
 * own picker and writes the file there: Android's share sheet has no "save to device", only
 * apps. On iPhone the share sheet already has "Save to Files", so it hands the file to that.
 * Where sharing files isn't possible, it falls back to sharing the text.
 */
export async function saveExport(
  copy: TernExport,
): Promise<{ outcome: ExportOutcome; savedAs?: string }> {
  const json = JSON.stringify(copy, null, 2);
  const name = exportFileName();

  if (Platform.OS === 'android') {
    // Backing out of the picker is the only way it fails without a folder.
    const folder = await Directory.pickDirectoryAsync().catch(() => null);
    if (!folder) return { outcome: ExportOutcome.Cancelled };
    folder.createFile(name, 'application/json').write(json);
    return { outcome: ExportOutcome.Saved, savedAs: name };
  }

  if (!(await Sharing.isAvailableAsync())) {
    await Share.share({ title: 'Tern data', message: json });
    return { outcome: ExportOutcome.Shared };
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Tern data',
  });
  return { outcome: ExportOutcome.Shared };
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
