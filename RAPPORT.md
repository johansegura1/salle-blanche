# Rapport:

## 1 Le besoin

Nous avons commencé ce projet par l'identification du besoin, au départ, la demande de notre cliente Claire, ingénieure en salle blanche était un peu flou, elle nous avait uniquement évoqué le problème du planning partagé et modifiable par tous impliquant le fait que parfois 2 personnes se retrouvent face au même équipement, au même moment, les 2 ayant bien réservé sur le planning. Pour avoir plus de details, nous avons discuté avec notre cliente (Voici le lien de nos discussions : https://github.com/gaetanmaisse/ismin-web-2026-tps/discussions/20). Après discussion avec Claire, nous avons conclu que les exigences étaient les suivante :

- Les utilisateurs sont des étudiants, des chercheurs, des ingénieurs etc.. ou des entreprises, tous doivent pouvoir effectuer leurs réservations directement sur le site sauf les entreprises qui doivent passer par elle. Il y a aussi 2 gestionnaires, Bruno et Claire, qui souhaitent pouvoir modifier/supprimer les réservations de n’importe qui, gérer les états de maintenance et fournir les habilitations (évoqués juste après).
- Pour pouvoir utiliser un équipement il faut une habilitation fournie par Claire ou Bruno, cette exigence est apparu uniquement apres avoir demandé de nous expliquer ce qu’elle aimerait pouvoir faire de plus sur l’application.
- Le premier qui réserve obtient sa réservation, il n’y a pas d’utilisateur prioritaire et les réservations se font sur des créneaux de 30 minutes du lundi au vendredi de 7h à 20h, « deux semaines au plus ».
- Une machine qui est en panne doit pouvoir être mise en état de maintenance, Claire souhaite pouvoir modifier cet état et le rendre visible de tous sur l’application afin d’éviter d’envoyer des mails pour prévenir une maintenance.

Donc l'écart entre la première demande de claire et les suivantes suite aux discussion est qu'il ne s'agit pas uniquement de réaliser un planning c'est de réaliser un planning fiable ou personne ne peut effacer la réservation d'une autre personne, il y a un aspect sécurité à respecter avec les habilitations, la gestion de l'etat de maintenance des equipements et enfin les roles, il y a 2 personnes qui gèrent tout face a 90 utilisateurs.

## 2. Les trois fonctionnalités

Apres l’identification des besoins, nous avons identifié les 3 fonctionalités de notre application:

### 1/ Reserver un equipement

Le planning doit aller du lundi au vendredi, de 7h a 20h avec des cases de 30 minutes ou les réservations de tous les utilisateurs sont visible de tous mais libérable uniquement par eux même depuis la page « Mes réservations » , sauf pour les gestionnaires Claire et Bruno qui pourront tout modifier. Ensuite il y a des regles de reservation : le premier a avoir reservé gagne: `api/src/reservations/reservations.service.ts:79`, commit [b83c1f4](https://github.com/johansegura1/salle-blanche/commit/b83c1f4) , il n’y a pas d’utilisateur “prioritaire”, les reservations se font sur des crenaux de 30 minutes, au plus 2 semaines avant et il ne peut pas y avoir de chevauchement, un utilisateur qui essayera de réserver sur un créneau deja reservé par quelqu’un recevra : « Ce créneau est déjà réservé. ». Et les entreprises reservent par l'intermédiaire d’un gestionnaire (Claire ou Bruno).

### 2/ Les habilitations

Ensuite il y a un aspect sécurité a prendre en compte, pour pouvoir utiliser un equipement il faut avoir l’habilitation requise, fournit par un gestionnaire depuis la page “Habilitations”. Pour un utilisateur n’ayant pas l’habilitation nécessaire pour utiliser un equipement, le formulaire sera absent et l’API enverra une erreur 403, `api/src/reservations/reservations.service.ts:67`, commit [10f323a](https://github.com/johansegura1/salle-blanche/commit/10f323a), [5bb97b0](https://github.com/johansegura1/salle-blanche/commit/5bb97b0) pour la page Habilitations.

### 3/ Les equipements et leur maintenance

Les equipements sont listé selon leur zone (préparation, fabrication, lithographie), avec un statut permettant aux utilisateur de savoir directement l’etat d’un equipement, permettant aux gestionnaires de se liberer d’une tache chronophage ( envoyer des mails de prevention), les utilisateurs verront egalement si ils sont habilité ou non pour chaque equipement. Quand un gestionnaire met un equipement en maintenance sur une periode, se dernier ne sera plus reservable par les utilisateurs et si une parti de leur periode de reservation est incluse dans celle de la maintenance de leur equipement en maintenance, l’etat de leur reservation passera a “annulé” avec une raison (`api/src/equipments/equipments.service.ts:54`, commit [48e7ff1](https://github.com/johansegura1/salle-blanche/commit/48e7ff1) ) qui sera visible depuis la page “Mes reservations”.

Nous avons ensuite écarté plusieurs fonctionalités. Premierement la gestion des facture d’entreprise qui est géré par une autre equipe donc inutile pour Claire ensuite la gestion d’acces pour les entreprises, elles passent par Claire donc inutile, ensuite Claire souhaitait pouvoir modifier la liste des equipements, nous l’avons écarté car selon nous ce n’était pas vraiment prioritaire par rapport aux 3 autres fonctionnalités, c’est quand meme faisable mais uniquement par nous (développeurs). Ensuite nous avions pensé a pouvoir creer des comptes etc nous l’avons exclue pour la meme raison, ces derniers sont créés par le seed ensuite nous avons aussi écarté le mail de notification sous la demande de claire qui souhaite que les etats des equipements soient directement visible dans l’application et enfin les utilisateurs “prioritaire” ont aussi été écarté sous la demande de Claire qui nous indique qu’elle fonctionne avec la regle du “premier arrivé premier servi”

## 3. Journal de décisions

Voici les choix de conception que nous avons fait, nos nos décisions écartés avec leurs raison ainsi que les commits associé

|Décision|Écarté|Pourquoi|Commit|
|-|-|-|-|
|L’API nous renvoyons une erreur 403 si personne de l’utilisateur n’ont pas l’habilitation|on peut cacher le formulaire tout seul|Cacher le formulaire ne servit à rien car la requête peut être envoyée directement à l'API|[b83c1f4](https://github.com/johansegura1/salle-blanche/commit/b83c1f4)|
|Tout le monde peut reserver/annuler ses propres reservations, Claire et Bruno peuvent annuler les reservations de tous les utilisateurs.|Tout le monde peut modifier le planning des réservations|c’est le problème qu' on essaie de résoudre pour Claire. Le but est de vérifier les réservations dans l’API, et bouton d’annulation.|[8e8e729](https://github.com/johansegura1/salle-blanche/commit/8e8e729), [b83c1f4](https://github.com/johansegura1/salle-blanche/commit/b83c1f4)|
|on a mis les équipements en forme liste dans `api/data/equipments.json`|Un écran d’administration pour gérer les équipements|ce n'était pas la priorité car on peut ajouter un équipement en modifiant le fichier, mais pas modifier ou supprimer un équipement déjà présent|[bb0c985](https://github.com/johansegura1/salle-blanche/commit/bb0c985)|
|Quand un equipement est en maintenance, la réservation s’annule de la période de maintenance.|les réservations restent même en période de maintenance, ou annuler la réservation sans le dire à l'utilisateur.|pour que l’utilisateur connaisse la raison de l’annulation de sa réservation.|[48e7ff1](https://github.com/johansegura1/salle-blanche/commit/48e7ff1)|
|Claire et Bruno gèrent les habilitations directement dans l’application.|Gérer les habilitations en dehors de l’application|dans l’application, ils le font seuls et très vite.|[10f323a](https://github.com/johansegura1/salle-blanche/commit/10f323a), [5bb97b0](https://github.com/johansegura1/salle-blanche/commit/5bb97b0)|
|la règle FIFO|les utilisateurs prioritaires|c’est la règle de claire c’est elle qui a demandé.|[b83c1f4](https://github.com/johansegura1/salle-blanche/commit/b83c1f4)|
|Les comptes sont créés par le seed.|Chaque utilisateur créerait son compte lui-même|On n'a pas besoin d'une page d’inscription parce que les utilisateurs sont connus par les gestionnaires.|[bb0c985](https://github.com/johansegura1/salle-blanche/commit/bb0c985)|

## 4. L’IA, écartée

un des cas quand on a écarté la proposition de l’IA est les identifiants aléatoires dans le seed c-a-d pour avoir un contexte concret ce qu’il se passe le seed est un script qui remplit le base de données a chaque demarrage. ce qu’il est dans le fichier :`api/prisma/seed.ts`.

l’IA nous a proposé à créer les comptes et les équipements sans identifiant fixe en inventant un au hasard par écrire ce syntaxe :

```ts
create: { ...user, passwordHash: hashPassword(password) },
```

Voila ce qu’il va passer une fois quelqu'un va connecter avec le serveur si on a fait ce qu’il demande. Au début, le serveur donne un jeton, ce dernier contient l’identifiant de l’utilisateur ce qu’il puisse à le navigateur a gardé le 8 heures. Quand l'utilisateur veut faire une réservation, le service avec son rôle doit chercher l’habilitation avec son identifiant. Après, ici il doit vérifier une condition si cet identifiant n’existe plus en base de donnée il sera automatiquement dire que l’utilisateur n’est pas habilité.

Et donc le problème quand on a lancé `docker compose down -v` pour supprimer le base de donnée puis `docker compose up --build` pour que la base se recrée, l’utilisateur eu un nouvel identifiant aléatoire, mais le navigateur gardait l’ancien jeton d’utilisateur qui lui même contient l’ancien identifiant c’est pour cela quand l’utilisateur veut faire une réservation, il échoue. Et on a réussi à le voir tester nous-mêmes sur un clone propre dans le navigateur.

et donc ce qu’on a fait a la place c’est que les identifiants fixes dans le seed : `user-lea`,`user-claire`, `eq-SB-010`… Ainsi un jeton reste correct après une réinitialisation de la base de données, et les adresses du planning restent les mêmes (`/equipments/eq-SB-010`). En remplaçant avec ce nouveau code `api/prisma/seed.ts:63` et `:72` .

```ts
create: { id: `user-${user.username}`, ...user, passwordHash: hashPassword(password) },
```

l’avant de commit: [bb0c985](https://github.com/johansegura1/salle-blanche/blob/bb0c985/api/prisma/seed.ts#L55) (`seed.ts:55`), et la correction au commit [34de025](https://github.com/johansegura1/salle-blanche/commit/34de025).

Pour conclure, on a trouvé que tester nous-mêmes de faire un clone propre dans le navigateur, a révélé ce que l’IA avait manqué.
