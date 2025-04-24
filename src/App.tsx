import { ThemeProvider } from '@/components/theme-provider';
import Layout from './layout';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout>
        <div className="flex flex-col justify-center"></div>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
