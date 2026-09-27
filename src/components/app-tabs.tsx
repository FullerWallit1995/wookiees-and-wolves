import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#07111F"
      indicatorColor="#16283A"
      labelStyle={{
        default: { color: '#8EA5BD' },
        selected: { color: '#FFFFFF' },
      }}
      tintColor="#FFFFFF"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="episodes">
        <NativeTabs.Trigger.Label>Episodes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="mic.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="predictor">
        <NativeTabs.Trigger.Label>Predictor</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="den">
        <NativeTabs.Trigger.Label>The Den</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}