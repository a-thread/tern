import React from 'react';
import { Linking } from 'react-native';

import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { SettingsPage } from '../components/SettingsPage';
import { TrailColors } from '@/domain/settings/models/trailColor';
import { Credits, listMeLink } from './models/credits';
import { TrailChoice } from './components/TrailChoice/TrailChoice';

/**
 * Settings › Credits: the Supporters who asked to be named. A Supporter can ask to be added
 * from here; nobody is listed without asking.
 */
export default function CreditsScreen() {
  const { supporter } = useSubscription();
  const toast = useToast();

  const askToBeListed = () =>
    Linking.openURL(listMeLink()).catch(() =>
      toast.show(`Couldn't open email. Write to ${Credits.CONTACT} instead.`),
    );

  return (
    <SettingsPage title='Credits'>
      <GroupLabel>Supporters</GroupLabel>
      <Group>
        {Credits.SUPPORTERS.length ? (
          Credits.SUPPORTERS.map((name) => <Row key={name} title={name} />)
        ) : (
          <Row
            title='No names here yet'
            sub='Supporters can ask to be listed'
          />
        )}
      </Group>
      {supporter ? (
        <>
          <GroupLabel>Your tern’s trail</GroupLabel>
          <Group>
            {TrailColors.ALL.map((trail) => (
              <TrailChoice key={trail} trail={trail} />
            ))}
          </Group>
          <FootNote>
            The line your tern has flown on Journey. It’s yours to keep if
            Supporter ends, and comes back if you support again.
          </FootNote>
          <Group>
            <Row
              title='Ask to be listed'
              sub='By email, with the name you’d like shown'
              chevron
              onPress={askToBeListed}
            />
          </Group>
          <FootNote>
            Thank you for supporting Tern. Names are added in the next update,
            and only if you ask.
          </FootNote>
        </>
      ) : (
        <FootNote>
          Tern Plus Supporters keep Tern free of ads, with nothing sold.
        </FootNote>
      )}
    </SettingsPage>
  );
}
