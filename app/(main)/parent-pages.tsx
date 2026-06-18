import { Redirect } from 'expo-router';

export default function LegacyParentPagesRoute() {
  return <Redirect href="/(parent)/pages" />;
}
