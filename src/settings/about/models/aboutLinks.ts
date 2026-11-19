import { Contact } from '@shared/models/contact';

/** Where the letter on About Tern links to. */
export class AboutLinks {
  static readonly SOURCE_CODE = 'https://github.com/a-thread/tern';
  static readonly EMAIL = `mailto:${Contact.EMAIL}`;
}
