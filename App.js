import React, { useRef, useEffect } from 'react';
import { BackHandler, SafeAreaView, StatusBar, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

const URL = 'https://vamos-ja.pages.dev/';

export default function App() {
  const ref = useRef(null);
  const canBack = useRef(false);
  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canBack.current && ref.current) { ref.current.goBack(); return true; }
      return false;
    });
    return () => h.remove();
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1720' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1720" />
      <WebView
        ref={ref}
        source={{ uri: URL }}
        style={{ flex: 1, backgroundColor: '#0f1720' }}
        javaScriptEnabled
        domStorageEnabled
        onNavigationStateChange={(s) => { canBack.current = s.canGoBack; }}
        onShouldStartLoadWithRequest={(r) => {
          if (r.url.startsWith(URL) || r.url.startsWith('about:')) return true;
          Linking.openURL(r.url);
          return false;
        }}
      />
    </SafeAreaView>
  );
}
