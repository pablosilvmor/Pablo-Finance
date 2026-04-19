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
  const { tags, addTag, deleteTag, updateTag } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8B5CF6');

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

  const handleDelete = (id: string) => {
    deleteTag(id);
    toast.success('Tag excluída com sucesso!');
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
              className="h-9 pl-9 pr-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddOpen(open);
          }}>
            <DialogTrigger render={
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Tag
              </Button>
            } />
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
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map(tag => (
              <div 
                key={tag.id} 
                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 group hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: tag.color }}>
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{tag.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tag)}>
                    <Edit2 className="w-4 h-4 text-zinc-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
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
