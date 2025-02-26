'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Activity } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Clock, GripVertical, MapPin, Save, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  onUpdate: (activity: Partial<Activity> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ActivityCard({ activity, onUpdate, onDelete }: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState(activity);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = async () => {
    await onUpdate(editedActivity);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50'
      )}
    >
      <Card className={cn(
        'transition-shadow',
        isDragging && 'shadow-lg'
      )}>
        <CardHeader className="flex flex-row items-center space-x-4 py-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedActivity.name}
                onChange={(e) => setEditedActivity({
                  ...editedActivity,
                  name: e.target.value
                })}
                className="font-medium"
              />
            ) : (
              <h3 className="font-medium">{activity.name}</h3>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {isEditing ? (
                <Input
                  type="time"
                  value={editedActivity.time}
                  onChange={(e) => setEditedActivity({
                    ...editedActivity,
                    time: e.target.value
                  })}
                  className="w-auto"
                />
              ) : (
                <span>{activity.time}</span>
              )}
            </div>
            
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-1" />
              {isEditing ? (
                <Input
                  value={editedActivity.location || ''}
                  onChange={(e) => setEditedActivity({
                    ...editedActivity,
                    location: e.target.value
                  })}
                  placeholder="Location"
                />
              ) : (
                <span>{activity.location}</span>
              )}
            </div>

            {isEditing ? (
              <Textarea
                value={editedActivity.description || ''}
                onChange={(e) => setEditedActivity({
                  ...editedActivity,
                  description: e.target.value
                })}
                placeholder="Description"
                className="mt-2"
              />
            ) : (
              activity.description && (
                <p className="text-sm">{activity.description}</p>
              )
            )}

            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(activity.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}