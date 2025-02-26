'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface PricingFeature {
  name: string;
  included: boolean;
  details?: string;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: PricingFeature[];
  max_users: number;
  is_recommended: boolean;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [pricingData, setPricingData] = useState<PricingTier[]>([
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for individual travelers',
      price_monthly: 10,
      price_annual: 100,
      max_users: 1,
      is_recommended: false,
      features: [
        { name: 'AI-powered itinerary generation', included: true },
        { name: 'Basic templates', included: true },
        { name: 'PDF export', included: true },
        { name: 'Email support', included: true },
        { name: 'Collaboration features', included: false },
        { name: 'Custom templates', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Great for small groups and families',
      price_monthly: 25,
      price_annual: 250,
      max_users: 5,
      is_recommended: true,
      features: [
        { name: 'AI-powered itinerary generation', included: true },
        { name: 'Basic templates', included: true },
        { name: 'PDF export', included: true },
        { name: 'Email support', included: true },
        { name: 'Collaboration features', included: true },
        { name: 'Custom templates', included: true },
        { name: 'Priority support', included: false },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For travel agencies and large groups',
      price_monthly: 50,
      price_annual: 500,
      max_users: 20,
      is_recommended: false,
      features: [
        { name: 'AI-powered itinerary generation', included: true },
        { name: 'Basic templates', included: true },
        { name: 'PDF export', included: true },
        { name: 'Email support', included: true },
        { name: 'Collaboration features', included: true },
        { name: 'Custom templates', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the perfect plan for your travel needs
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <Label htmlFor="billing-toggle">Monthly</Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle">
              Annual <span className="text-green-600">(Save 15%)</span>
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingData.map((tier) => (
            <Card
              key={tier.id}
              className={`p-8 relative transition-all hover:shadow-lg ${
                tier.is_recommended
                  ? 'border-primary shadow-md scale-105'
                  : ''
              }`}
            >
              {tier.is_recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
                <p className="text-muted-foreground mb-4">{tier.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    ${isAnnual ? tier.price_annual / 12 : tier.price_monthly}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-muted-foreground">
                    Billed annually (${tier.price_annual}/year)
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={
                        feature.included ? '' : 'text-muted-foreground'
                      }
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={tier.is_recommended ? 'default' : 'outline'}
                asChild
              >
                <Link href="/signup">Select {tier.name}</Link>
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Need Something Different?</h3>
          <p className="text-muted-foreground mb-8">
            Contact us for custom pricing options or if you have any questions.
          </p>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}