# BinusSphere

BinusSphere is a university-focused social platform designed specifically for BINUS students. The platform combines a discussion forum, campus marketplace, direct messaging system, and student profiles into a single centralized application.

## Features

### Forum

* Create and share posts with the BINUS community
* Like and comment on discussions
* Browse trending topics and campus conversations
* Search posts by keywords

### User Profiles

* Custom profile picture and banner
* Editable username and bio
* Public or private account settings
* Personal post history

### Social Features

* Notification system
* User interaction management
* Report and block functionality

### Search

* Search posts across the platform
* Keyword highlighting in results
* Search suggestions and recommendations

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend & Database

* Supabase
* PostgreSQL

### Deployment

* Vercel

## Project Structure

```text
src/
├── app/
│   ├── home/
│   ├── forum/
│   ├── marketplace/
│   ├── profile/
│   ├── notifications/
│   ├── messages/
│   └── lib/
├── components/
└── public/
```

## Installation

1. Clone the repository

```bash
git clone https://github.com/zcleips/binussphere.git
cd binussphere
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server

```bash
npm run dev
```

5. Open

```text
http://localhost:3000
```

## Deployment

The application is deployed using Vercel and automatically updates when changes are pushed to the main branch.

## Future Improvements

* Real-time messaging
* Image uploads for posts
* Marketplace product categories
* Enhanced moderation tools
* Student verification system
* Mobile responsiveness improvements
* Recommendation system

## Authors

Christina Angela Jodana, Farrel Immanuel, Billie Godwin
