import React, { useState } from 'react';
import { Briefcase, Plus, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useAppStore } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { iconMap } from '@/lib/icons';

export const CostCenters = () => {
  const { costCenters, addCostCenter, deleteCostCenter, bulkDeleteCostCenters, updateCostCenter } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8B5CF6');
  const [newIcon, setNewIcon] = useState('briefcase');
  const [selectedCostCenterIds, setSelectedCostCenterIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleAddCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    const exists = costCenters.some(c => c.name.toLowerCase() === newName.toLowerCase() && (!editingCostCenter || c.id !== editingCostCenter.id));
    if (exists) {
      toast.error(`O centro de custo "${newName}" já existe.`);
      return;
    }

    if (editingCostCenter) {
      updateCostCenter(editingCostCenter.id, {
        name: newName,
        color: newColor,
        icon: newIcon
      });
      toast.success('Centro de custo atualizado com sucesso!');
    } else {
      addCostCenter({
        name: newName,
        color: newColor,
        icon: newIcon
      });
      toast.success('Centro de custo criado com sucesso!');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewColor('#8B5CF6');
    setNewIcon('briefcase');
    setIsAddOpen(false);
    setEditingCostCenter(null);
  };

  const handleEdit = (costCenter: any) => {
    setEditingCostCenter(costCenter);
    setNewName(costCenter.name);
    setNewColor(costCenter.color);
    setNewIcon(costCenter.icon || 'briefcase');
    setIsAddOpen(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSelectionMode(true);
    if (!selectedCostCenterIds.includes(id)) {
      setSelectedCostCenterIds(prev => [...prev, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCostCenterIds.length === 0) return;
    bulkDeleteCostCenters(selectedCostCenterIds).then(() => {
      toast.success(`${selectedCostCenterIds.length} ${selectedCostCenterIds.length === 1 ? 'centro de custo excluído' : 'centros de custo excluídos'}!`);
      setSelectedCostCenterIds([]);
      setIsSelectionMode(false);
    }).catch(console.error);
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCostCenterIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedCostCenterIds.length === filteredCostCenters.length) {
      setSelectedCostCenterIds([]);
    } else {
      setSelectedCostCenterIds(filteredCostCenters.map(c => c.id));
    }
  };

  const filteredCostCenters = costCenters.filter(costCenter => 
    costCenter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Centros de Custo</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar centro de custo..."
              className="h-9 pl-9 pr-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddOpen(open);
          }}>
            {isSelectionMode && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full h-9 px-4"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedCostCenterIds([]);
                  }}
                >
                  Cancelar
                </Button>
                {selectedCostCenterIds.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-full shrink-0 h-9 px-3 bg-red-500 hover:bg-red-600 gap-2"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:inline">Confirmar ({selectedCostCenterIds.length})</span>
                  </Button>
                )}
              </div>
            )}
            {!isSelectionMode && (
              <DialogTrigger 
                render={
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Centro
                  </Button>
                }
              />
            )}
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCostCenter} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Ex: Viagem Paris" />
                </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-16 p-1 h-10" />
                      <Input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <div className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-1 border rounded-md">
                      {Object.entries(iconMap).map(([key, Icon]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewIcon(key)}
                          className={`p-2 rounded-md flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${newIcon === key ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-500' : 'border border-transparent'}`}
                        >
                          <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    {editingCostCenter ? 'Atualizar' : 'Salvar'}
                  </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-[#1A1A1A] overflow-hidden">
        {isSelectionMode && (
          <div className="flex items-center justify-between px-6 pt-6 -mb-2">
            <div className="flex items-center gap-2 px-2">
              <input 
                type="checkbox" 
                className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                checked={selectedCostCenterIds.length === filteredCostCenters.length && filteredCostCenters.length > 0}
                onChange={toggleAllSelection}
                id="select-all-costcenters"
              />
              <label htmlFor="select-all-costcenters" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">
                Selecionar todos
              </label>
            </div>
          </div>
        )}
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCostCenters.map(costCenter => {
              const isSelected = selectedCostCenterIds.includes(costCenter.id);
              return (
              <div 
                key={costCenter.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors group ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 hover:border-purple-500/50'}`}
                onClick={(e) => isSelectionMode ? toggleSelection(costCenter.id, e) : handleEdit(costCenter)}
              >
                <div className="flex items-center gap-3">
                  {isSelectionMode && (
                    <div className="flex items-center justify-center mr-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                        checked={isSelected}
                        onChange={(e) => toggleSelection(costCenter.id, e as any)}
                      />
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: costCenter.color }}>
                    {(() => {
                      const Icon = iconMap[costCenter.icon || 'briefcase'] || Briefcase;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{costCenter.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(costCenter); }}>
                    <Edit2 className="w-4 h-4 text-zinc-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDelete(costCenter.id, e)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            )})}
            {filteredCostCenters.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                Nenhum centro de custo encontrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
