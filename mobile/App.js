import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useSocket } from './src/hooks/useSocket';
import { C, S, R } from './src/theme/colors';

import DashboardScreen from './src/screens/DashboardScreen';
import CellsScreen     from './src/screens/CellsScreen';
import SensorsScreen   from './src/screens/SensorsScreen';
import AIScreen        from './src/screens/AIScreen';
import FaultsScreen    from './src/screens/FaultsScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import DigitalTwinScreen from './src/screens/DigitalTwinScreen';
import ResearchScreen  from './src/screens/ResearchScreen';
import LiveStreamScreen from './src/screens/LiveStreamScreen';
import AnimatedBackground from './src/components/AnimatedBackground';

const Tab = createBottomTabNavigator();

// Tab configuration — icon names from Ionicons
const TABS = [
  { name: 'Dashboard',   title: 'Dashboard',       icon: 'grid-outline',       iconFocused: 'grid' },
  { name: 'Twin',        title: 'Digital Twin',    icon: 'cube-outline',       iconFocused: 'cube' },
  { name: 'Cells',       title: 'Cell Analytics',  icon: 'battery-half',       iconFocused: 'battery-half' },
  { name: 'Sensors',     title: 'Sensor Monitor',  icon: 'hardware-chip-outline', iconFocused: 'hardware-chip' },
  { name: 'AI',          title: 'AI Insights',     icon: 'options-outline',    iconFocused: 'options' },
  { name: 'Research',    title: 'Research',        icon: 'flask-outline',      iconFocused: 'flask' },
  { name: 'Faults',      title: 'Fault Reports',   icon: 'warning-outline',    iconFocused: 'warning' },
  { name: 'LiveStream',  title: 'Live Stream',     icon: 'radio-outline',      iconFocused: 'radio' },
  { name: 'Settings',    title: 'System Config',   icon: 'settings-outline',   iconFocused: 'settings' },
];

// ─── Sidebar Menu ─────────────────────────────────────────────────────────────
function SidebarMenu({ navigation, routeName }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 9, tension: 65 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();
  };

  const closeMenu = (callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -300, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setOpen(false);
      if (typeof callback === 'function') callback();
    });
  };
  
  return (
    <>
      <TouchableOpacity onPress={openMenu} style={ss.menuBtn} activeOpacity={0.6}>
        <Ionicons name="menu" size={26} color={C.text} />
      </TouchableOpacity>

      <Modal visible={open} animationType="none" transparent={true} onRequestClose={closeMenu}>
        <View style={ss.menuOverlay}>
          <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
            <Pressable style={ss.menuBackdrop} onPress={() => closeMenu()} />
          </Animated.View>
          <Animated.View style={[ss.menuSidebar, { paddingTop: insets.top + 10, transform: [{ translateX: slideAnim }] }]}>
            <View style={ss.menuHeader}>
              <Text style={ss.menuHeaderNav}>NAVIGATION</Text>
              <TouchableOpacity onPress={() => closeMenu()} style={ss.menuCloseBtn}>
                <Ionicons name="close" size={24} color={C.text3} />
              </TouchableOpacity>
            </View>
            <View style={ss.menuItems}>
              {TABS.map(tab => {
                const isActive = routeName === tab.name;
                return (
                  <TouchableOpacity
                    key={tab.name}
                    style={[ss.menuItem, isActive && ss.menuItemActive]}
                    onPress={() => {
                      closeMenu(() => navigation.navigate(tab.name));
                    }}
                  >
                    <Ionicons 
                      name={isActive ? tab.iconFocused : tab.icon} 
                      size={22} 
                      color={isActive ? C.blue : C.text3} 
                    />
                    <Text style={[ss.menuItemText, isActive && ss.menuItemTextActive]}>
                      {tab.title}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons 
                      name="chevron-forward" 
                      size={18} 
                      color={isActive ? C.blue : C.text4} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ─── Floating AI Bot Button ───────────────────────────────────────────────────
function FloatingAIButton({ data, connected }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const tabBarH = Platform.OS === 'ios' ? 106 + insets.bottom : 82;

  return (
    <>
      {/* FAB */}
      <TouchableOpacity
        style={[ss.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.88}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={C.white} />
        {connected && <View style={ss.fabDot} />}
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={ss.modalWrap}>
          <AIScreen data={data} connected={connected} onClose={() => setOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { data, connected, history } = useSocket();
  const pageProps = { data, connected, history };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={C.surface} />
      <NavigationContainer>
        <AnimatedBackground />
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Tab.Navigator
            sceneContainerStyle={{ backgroundColor: 'transparent' }}
            screenOptions={({ route, navigation }) => {
              const tab = TABS.find(t => t.name === route.name);
              return {
                headerStyle: {
                  backgroundColor: C.surface,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                },
                headerTitleStyle: {
                  fontSize: 15,
                  fontWeight: '800',
                  color: C.text,
                },
                headerLeft: () => <SidebarMenu navigation={navigation} routeName={route.name} />,
                headerRight: () => (
                  <View style={ss.headerRight}>
                    <View style={[ss.headerDot, { backgroundColor: connected ? C.green : C.text4 }]} />
                    <Text style={[ss.headerStatus, { color: connected ? C.greenText : C.text4 }]}>
                      {connected ? 'Live' : 'Offline'}
                    </Text>
                  </View>
                ),
                tabBarStyle: { display: 'none' }, // Hides the bottom navigation bar
              };
            }}
          >
            {TABS.map(tab => (
              <Tab.Screen
                key={tab.name}
                name={tab.name}
                options={{ title: tab.title }}
              >
                {() => {
                  const screens = {
                    Dashboard: <DashboardScreen {...pageProps} />,
                    Twin:      <DigitalTwinScreen {...pageProps} />,
                    Cells:     <CellsScreen     {...pageProps} />,
                    Sensors:   <SensorsScreen   {...pageProps} />,
                    AI:        <AIScreen        {...pageProps} onClose={() => navigation.navigate('Dashboard')} />,
                    Research:  <ResearchScreen  {...pageProps} />,
                    Faults:    <FaultsScreen    {...pageProps} />,
                    LiveStream:<LiveStreamScreen {...pageProps} />,
                    Settings:  <SettingsScreen  {...pageProps} />,
                  };
                  return screens[tab.name] ?? null;
                }}
              </Tab.Screen>
            ))}
          </Tab.Navigator>

          {/* Floating AI Bot */}
          <FloatingAIButton data={data} connected={connected} />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const ss = StyleSheet.create({
  // Header
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginRight: S.base, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: R.full, backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border,
  },
  headerDot:    { width: 7, height: 7, borderRadius: 4 },
  headerStatus: { fontSize: 12, fontWeight: '700' },

  // Menu Sidebar
  menuBtn: { padding: S.sm, paddingHorizontal: S.base },
  menuOverlay: { flex: 1, flexDirection: 'row' },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuSidebar: { width: 300, backgroundColor: C.surface, height: '100%', elevation: 16, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 10 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.xl, paddingBottom: S.md, paddingTop: S.md },
  menuHeaderNav: { fontSize: 13, fontWeight: '800', color: C.text3, letterSpacing: 1.0 },
  menuCloseBtn: { padding: 4, marginRight: -8 },
  menuItems: { paddingHorizontal: S.md, gap: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: S.base, borderRadius: R.md },
  menuItemActive: { backgroundColor: C.blue + '15' },
  menuItemText: { fontSize: 15, fontWeight: '500', color: C.text2 },
  menuItemTextActive: { color: C.blue, fontWeight: '800' },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  fabDot: {
    position: 'absolute', top: 5, right: 5,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.green,
    borderWidth: 2, borderColor: C.white,
  },

  // Modal
  modalWrap:     { flex: 1, backgroundColor: C.bg },
  modalHeader:   { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: S.base, paddingTop: S.sm, paddingBottom: S.md },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border2, alignSelf: 'center', marginBottom: S.md },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  modalAvatar:   { width: 42, height: 42, borderRadius: R.full, backgroundColor: C.primaryBg, borderWidth: 1, borderColor: C.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  modalTitle:    { fontSize: 16, fontWeight: '800', color: C.text },
  modalSub:      { fontSize: 11, color: C.text4, marginTop: 2 },
  closeBtn:      { padding: S.sm, borderRadius: R.full, backgroundColor: C.surface3 },
});
