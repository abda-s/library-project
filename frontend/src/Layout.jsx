import Sidebar from './components/Sidebar';

export default function Layout({children}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8"> {/* Adjust margin based on sidebar width */}
        {children}
      </main>
    </div>
  );
};