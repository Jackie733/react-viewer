import { ThemeProvider } from '@/components/theme-provider';
import { Button } from './components/ui/button';
import Layout from './layout';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout>
        <div className="flex flex-col justify-center">
          <Button>Click me</Button>
        </div>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
