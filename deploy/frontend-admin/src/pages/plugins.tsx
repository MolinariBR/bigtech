// Página de gestão de plugins (TASK-013)
import PluginManager from '@/components/PluginManager';

export default function PluginsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestão de Plugins</h1>
      <PluginManager />
    </div>
  );
}