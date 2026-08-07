import type { Recipe } from './types';

export const DEFAULT_RECIPES: Omit<Recipe, 'id' | 'created_at'>[] = [
  {
    name: 'Beeren-Hafer-Bowl',
    category: 'Frühstück',
    time_minutes: 10,
    emoji: '🥣',
    ingredients: `80g Haferflocken
200ml Hafermilch oder Mandelmilch
1 Handvoll gemischte Beeren (frisch oder TK)
1 EL Chiasamen
1 TL Honig oder Ahornsirup
1 EL Mandelmus
1 Prise Zimt`,
    instructions: `Haferflocken mit Milch in eine Schüssel geben und 5 Minuten quellen lassen.
Chiasamen unterrühren und weitere 2 Minuten quellen lassen.
Beeren obenauf geben.
Mit Mandelmus, Honig und Zimt toppen.
Sofort servieren oder über Nacht im Kühlschrank ziehen lassen.`,
    macro_veggies: 40,
    macro_carbs: 40,
    macro_protein: 20,
    tip: 'Für eine Overnight-Variante einfach über Nacht im Kühlschrank lassen – so wird die Bowl noch cremiger!',
  },
  {
    name: 'Griechischer Quinoa-Salat',
    category: 'Hauptgericht',
    time_minutes: 20,
    emoji: '🥗',
    ingredients: `200g Quinoa
400ml Gemüsebrühe
1 Gurke
200g Kirschtomaten
1 rote Paprika
100g Kalamata-Oliven
200g Feta
1 rote Zwiebel
Saft von 1 Zitrone
3 EL Olivenöl
1 TL Oregano
Salz und Pfeffer`,
    instructions: `Quinoa in der Gemüsebrühe nach Packungsanweisung kochen und abkühlen lassen.
Gurke würfeln, Tomaten halbieren, Paprika in Stücke schneiden.
Zwiebel in feine Ringe schneiden.
Alle Zutaten in einer großen Schüssel vermengen.
Dressing aus Zitronensaft, Olivenöl, Oregano, Salz und Pfeffer anrühren.
Alles gut vermischen und Feta zerkrümeln.
Mindestens 10 Minuten ziehen lassen.`,
    macro_veggies: 50,
    macro_carbs: 30,
    macro_protein: 20,
    tip: 'Schmeckt am nächsten Tag noch besser, wenn der Salat durchgezogen ist!',
  },
  {
    name: 'Lachs mit Ofengemüse',
    category: 'Hauptgericht',
    time_minutes: 30,
    emoji: '🐟',
    ingredients: `2 Lachsfilets (je ca. 180g)
2 Paprika (verschiedene Farben)
2 Zucchini
1 rote Zwiebel
200g Kirschtomaten
3 EL Olivenöl
2 Knoblauchzehen
1 Zitrone
Frischer Dill oder Petersilie
Salz, Pfeffer, Paprikapulver`,
    instructions: `Ofen auf 200°C Umluft vorheizen.
Gemüse in mundgerechte Stücke schneiden und auf einem Backblech verteilen.
Mit 2 EL Olivenöl, Knoblauch, Salz und Pfeffer würzen.
20 Minuten im Ofen rösten.
Lachs mit Olivenöl einreiben und würzen.
Lachs zum Gemüse geben und weitere 12–15 Minuten garen.
Mit Zitronensaft und frischen Kräutern servieren.`,
    macro_veggies: 50,
    macro_carbs: 15,
    macro_protein: 35,
    tip: 'Der Lachs ist perfekt, wenn er sich leicht mit einer Gabel auseinanderziehen lässt.',
  },
];
