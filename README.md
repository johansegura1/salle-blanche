# Salle blanche : le planning des équipements

Projet Développement Web, ISMIN 3A. Johan Segura et Souhaib Hajjaj.

Claire gère la salle blanche du Centre de microélectronique : une centaine d'équipements, réservés jusqu'ici sur un tableur que tout le monde pouvait modifier. Cette application le remplace :

1. **Réserver un équipement** : le planning de la semaine, en créneaux de 30 minutes, du lundi au vendredi de 7 h à 20 h, au plus deux semaines à l'avance. Pas de chevauchement : le premier qui réserve a le créneau. Chacun libère ses propres créneaux, depuis le planning ou « Mes réservations » ; un gestionnaire peut annuler n'importe quelle réservation.
2. **Gérer les habilitations** : seule une personne formée sur un équipement peut le réserver. Les gestionnaires accordent et retirent les habilitations.
3. **Les équipements et leur maintenance** : la liste par zone, avec leur statut. Un gestionnaire met un équipement en maintenance : il n'est plus réservable, et les réservations de la période passent à « annulée », visibles par leurs auteurs.

Le besoin, les choix et ce qu'on a laissé de côté : [`RAPPORT.md`](./RAPPORT.md). Les échanges avec la cliente : [le fil du sujet](https://github.com/gaetanmaisse/ismin-web-2026-tps/discussions/20).

## Lancer l'application

```sh
docker compose up --build
```

| Adresse | |
|---|---|
| http://localhost:8080 | l'application |
| http://localhost:3000/health | l'état de l'API |
| http://localhost:3000/docs | la documentation de l'API (Swagger) |

Comptes de démonstration, mot de passe `secret` pour tous :

| Identifiant | Rôle | |
|---|---|---|
| `claire` | gestionnaire | tout voir, tout modifier, réserver pour une entreprise |
| `bruno` | gestionnaire | |
| `lea` | utilisatrice | habilitée sur six équipements |
| `noah` | utilisateur | habilité sur deux équipements |

Les données survivent à `docker compose down`. Pour repartir d'une base neuve : `docker compose down -v`.

## Les tests

```sh
cd api && npm ci && npm test     # 50 tests : règles des créneaux, réservations, habilitations, maintenance, rôles
cd web && npm ci && npm test     # 30 tests : pages, connexion, erreurs de l'API
```

Les tests de l'API créent leur propre base, `test.db` : ils ne touchent jamais à `dev.db`.

## Développer sans Docker

```sh
cd api && cp .env.example .env && npm install && npx prisma migrate dev && npm run db:seed && npm run start:dev
cd web && cp .env.example .env && npm install && npm run dev      # http://localhost:5173
```

## Organisation

```text
compose.yaml            migrate (migrations + seed), api (NestJS, port 3000), web (nginx, port 8080)
api/
  prisma/               le schéma, les migrations, le seed
  data/                 les comptes, équipements et habilitations de démonstration
  src/auth/             connexion JWT, AuthGuard, @Roles et RolesGuard
  src/equipments/       la liste, le statut, la maintenance
  src/reservations/     le planning, réserver, annuler ; slot-rules.ts : les règles d'un créneau
  src/habilitations/    accorder, retirer
  test/                 les tests de bout en bout et des règles
web/src/
  pages/                Équipements, Planning, Mes réservations, Habilitations, Connexion
  api.ts                les appels à l'API
```

Bâti à partir du code du TP10 du cours.
