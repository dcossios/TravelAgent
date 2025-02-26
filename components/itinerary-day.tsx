'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Activity, Itinerary } from '@/lib/supabase/types';
import { ActivityCard } from './activity-card';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

interface ItineraryDayProps {
  itinerary: Itinerary;
  activities: Activity[];
  onActivityUpdate: (activity: Partial<Activity> & { id: string }) => Promise<void>;
  onActivityDelete: (id: string) => Promise<void>;
  onActivitiesReorder: (activities: { id: string; order: number }[]) => Promise<void>;
  onActivityCreate: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function ItineraryDay({
  itinerary,
  activities,
  onActivityUpdate,
  onActivityDelete,
  onActivitiesReorder,
  onActivityCreate,
}: ItineraryDayProps) {
  const [items, setItems] = useState(activities);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers
        const updates = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));
        
        onActivitiesReorder(updates);
        return newItems;
      });
    }
  };

  const handleCreateActivity = () => {
    const newActivity = {
      itinerary_id: itinerary.id,
      name: 'New Activity',
      time: '09:00',
      location: '',
      description: '',
      order: items.length,
    };
    onActivityCreate(newActivity);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Day {itinerary.day_number}</CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {items.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onUpdate={onActivityUpdate}
                  onDelete={onActivityDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={handleCreateActivity}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </CardContent>
    </Card>
  );
}