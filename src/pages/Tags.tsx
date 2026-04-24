import React, { useState } from 'react';
import { Tag, Plus, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useAppStore } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const Tags = () => {
  const { tags, addTag, deleteTag, bulkDeleteTags, updateTag } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8B5CF6');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    const exists = tags.some(t => t.name.toLowerCase() === newName.toLowerCase() && (!editingTag || t.id !== editingTag.id));
    if (exists) {
      toast.error(`A tag "${newName}" já existe.`);
      return;
    }

    if (editingTag) {
      updateTag(editingTag.id, {
        name: newName,
        color: newColor,
      });
      toast.success('Tag atualizada com sucesso!');
    } else {
      addTag({
        name: newName,
        color: newColor,
      });
      toast.success('Tag criada com sucesso!');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewColor('#8B5CF6');
    setIsAddOpen(false);
    setEditingTag(null);
  };

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setNewName(tag.name);
    setNewColor(tag.color);
    setIsAddOpen(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSelectionMode(true);
    if (!selectedTagIds.includes(id)) {
      setSelectedTagIds(prev => [...prev, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTagIds.length === 0) return;
    bulkDeleteTags(selectedTagIds).then(() => {
      toast.success(`${selectedTagIds.length} ${selectedTagIds.length === 1 ? 'tag excluída' : 'tags excluídas'}!`);
      setSelectedTagIds([]);
      setIsSelectionMode(false);
    }).catch(console.error);
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTagIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedTagIds.length === filteredTags.length) {
      setSelectedTagIds([]);
    } else {
      setSelectedTagIds(filteredTags.map(t => t.id));
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tags</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar tag..."
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
                    setSelectedTagIds([]);
                  }}
                >
                  Cancelar
                </Button>
                {selectedTagIds.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-full shrink-0 h-9 px-3 bg-red-500 hover:bg-red-600 gap-2"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:inline">Confirmar ({selectedTagIds.length})</span>
                  </Button>
                )}
              </div>
            )}
            {!isSelectionMode && (
              <DialogTrigger render={
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tag
                </Button>
              } />
            )}
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTag} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Tag</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Ex: Viagem" />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-16 p-1 h-10" />
                    <Input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  {editingTag ? 'Atualizar Tag' : 'Salvar Tag'}
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
                checked={selectedTagIds.length === filteredTags.length && filteredTags.length > 0}
                onChange={toggleAllSelection}
                id="select-all-tags"
              />
              <label htmlFor="select-all-tags" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">
                Selecionar todas
              </label>
            </div>
          </div>
        )}
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map(tag => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
              <div 
                key={tag.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors group ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 hover:border-purple-500/50'}`}
                onClick={(e) => isSelectionMode ? toggleSelection(tag.id, e) : handleEdit(tag)}
              >
                <div className="flex items-center gap-3">
                  {isSelectionMode && (
                    <div className="flex items-center justify-center mr-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                        checked={isSelected}
                        onChange={(e) => toggleSelection(tag.id, e as any)}
                      />
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: tag.color }}>
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{tag.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(tag); }}>
                    <Edit2 className="w-4 h-4 text-zinc-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDelete(tag.id, e)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            )})}
            {filteredTags.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                Nenhuma tag encontrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
