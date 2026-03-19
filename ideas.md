Main Features:
Online portfolio (ui is a binder)
Can see other nearby binders based on your current location (location is approximate rather than exact)
Card recommendation for a user’s binder based on missing slots on their binder page (maybe AI or trend analysis?)
People need to upload images of their card (front and back) before the card is added to their online binder
Review system for users (know which users to trust)
Users can tag a specific card in their binder that they are willing to trade/sell, or pending for a trade
People can message other people to trade cards
For now, we’re only making a mobile app for iOS/Android (we may extend this project to cross-platform later on)
Users start with 1 binder for free
Wishlist in a user’s profile
Basic market price info for each card
Card database to search up cards

Extra Stuff:
People need to watch ads/pay to expand their binder
Cosmetics (i.e. new binder, 3x3 binders, 2x2 binders, decorations) can be bought
Collection progress system (e.g. this set is completed 72%)
Some achievement for users

Tech stack:
Mobile app: Expo + React Native + TypeScript
Routing: Expo Router
Backend: Supabase
Database: Postgres on Supabase
Auth: Supabase Auth
Images: Supabase Storage
Offline/local cache: Expo SQLite
Server logic: Supabase Edge Functions
Data fetching/cache: TanStack Query
State: Zustand or simple context/reducer setup
APIs: https://scrydex.com/ (Pokemon TCG Database), https://developer.ebay.com/develop/guides-v2/get-started-with-ebay-apis/get-started-with-ebay-apis#overview (Ebay API for getting card prices), OCR (scanning card text and auto filling), use Phone’s native location services for getting location of user

Budget Costs:
For most tech stuff (e.g. Supabase, OpenAI, AWS, etc.), David has enough credits
Marketing costs

Marketing:
Attend trade shows and get people to use our app
Trading card clubs
Hit up youtubers/streamers to advertise our app
Make instagram reels
Pay big name companies (i.e. instagram, youtube) to advertise our app
Create a Whatnot to advertise our app (all on Cristiano)
Get my boy Justin to advertise it
