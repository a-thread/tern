import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Directory } from 'expo-file-system';

import { ExportOutcome, saveExport } from './backupFile';
import type { TernExport } from '@/domain/settings/models/ternExport';

const mockWrite = jest.fn();
const mockCreateFile = jest.fn(() => ({ write: mockWrite }));

jest.mock('expo-file-system', () => ({
  Directory: { pickDirectoryAsync: jest.fn() },
  File: jest.fn().mockImplementation(() => ({
    exists: false,
    create: jest.fn(),
    delete: jest.fn(),
    write: jest.fn(),
    uri: 'file:///cache/tern-export.json',
  })),
  Paths: { cache: 'file:///cache' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
jest.mock('expo-document-picker', () => ({}));

const copy = { exportedAt: '2026-10-21T08:00:00.000Z', weightUnit: 'lb' } as TernExport;
const pick = Directory.pickDirectoryAsync as jest.Mock;

function onPlatform(os: 'android' | 'ios') {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('saveExport on Android', () => {
  beforeEach(() => onPlatform('android'));

  it('writes the file into the folder the person picks', async () => {
    pick.mockResolvedValue({ createFile: mockCreateFile });
    const result = await saveExport(copy);
    expect(result.outcome).toBe(ExportOutcome.Saved);
    expect(result.savedAs).toMatch(/^tern-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mockCreateFile).toHaveBeenCalledWith(result.savedAs, 'application/json');
    expect(JSON.parse(mockWrite.mock.calls[0][0])).toEqual(copy);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('saves nothing when the person backs out of the picker', async () => {
    pick.mockRejectedValue(new Error('cancelled'));
    expect(await saveExport(copy)).toEqual({ outcome: ExportOutcome.Cancelled });
    expect(mockCreateFile).not.toHaveBeenCalled();
  });
});

describe('saveExport on iPhone', () => {
  beforeEach(() => onPlatform('ios'));

  it('hands the file to the share sheet, which has "Save to Files"', async () => {
    expect(await saveExport(copy)).toEqual({ outcome: ExportOutcome.Shared });
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/tern-export.json',
      expect.objectContaining({ mimeType: 'application/json' }),
    );
    expect(pick).not.toHaveBeenCalled();
  });
});
