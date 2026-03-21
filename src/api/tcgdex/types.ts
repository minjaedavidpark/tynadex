/*
Put typescript interfaces here
*/

export interface TcgdexImage {
  small?: string;
  high?: string;
}

export interface TcgdexSetRef {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
}

export interface TcgdexCardSummary {
  id: string;
  localId?: string;
  name: string;
  image?: string;
}

export interface TcgdexCard {
  id: string;
  localId?: string;
  name: string;
  image?: string;
  category?: string;
  hp?: number;
  rarity?: string;
  illustrator?: string;
  set?: TcgdexSetRef;
}

export interface TcgdexSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    official: number;
    total: number;
  };
}