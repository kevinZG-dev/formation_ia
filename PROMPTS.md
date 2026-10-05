# Journal des prompts

Une entrée par demande significative faite à Copilot pendant les TP. Ce journal fait partie du livrable : il montre comment vous avez guidé l’assistant et ce que vous avez corrigé.

| TP | Prompt envoyé (ou résumé fidèle) | Ce que Copilot a produit | Ce que j’ai gardé, corrigé ou refusé, et pourquoi |
|---|---|---|---|
| exemple | « Écris les tests de `calculerLigne` avec node:test, à partir de docs/regles-remises.md, un test par règle et par seuil » | 9 tests, dont un sur le seuil de 10 unités | Gardé. Refusé un test qui vérifiait un prix négatif accepté : la spec le refuse |

| exemple | « Écris une fonction qui valide une référence produit. » | 9 tests, dont un sur le seuil de 10 unités | Gardé. Refusé un test qui vérifiait un prix négatif accepté : la spec le refuse |


## Mesures avant
- Tests de caractérisation :53.265958ms
- Temps médian (bench) :3477.9 ms
- Avertissements ESLint :
/Users/kevinzg/Github/inoco/formation_ia/df-commandes/src/legacy/export-commandes.js
   3:1   warning  Unexpected var, use let or const instead                no-var
   7:5   warning  Unexpected var, use let or const instead                no-var
   9:7   warning  Unexpected var, use let or const instead                no-var
  20:3   warning  Unexpected var, use let or const instead                no-var
  31:48  warning  Function has a complexity of 19. Maximum allowed is 10  complexity
  36:9   warning  Unexpected var, use let or const instead                no-var
  37:14  warning  Unexpected var, use let or const instead                no-var
  38:11  warning  Unexpected var, use let or const instead                no-var
  39:11  warning  Unexpected var, use let or const instead                no-var
  40:16  warning  Unexpected var, use let or const instead                no-var
  41:31  warning  Expected '===' and instead saw '=='                     eqeqeq
  45:11  warning  Unexpected var, use let or const instead                no-var
  46:11  warning  Unexpected var, use let or const instead                no-var
  47:16  warning  Unexpected var, use let or const instead                no-var
  48:39  warning  Expected '===' and instead saw '=='                     eqeqeq
  53:24  warning  Expected '===' and instead saw '=='                     eqeqeq
  56:11  warning  Unexpected var, use let or const instead                no-var
  57:11  warning  Unexpected var, use let or const instead                no-var
  58:34  warning  Expected '===' and instead saw '=='                     eqeqeq
  61:13  warning  Unexpected var, use let or const instead                no-var
  62:29  warning  Expected '===' and instead saw '=='                     eqeqeq
  67:11  warning  Unexpected var, use let or const instead                no-var
  68:11  warning  Unexpected var, use let or const instead                no-var
  69:35  warning  Expected '===' and instead saw '=='                     eqeqeq
  72:13  warning  Unexpected var, use let or const instead                no-var
  73:29  warning  Expected '===' and instead saw '=='                     eqeqeq
  78:11  warning  Unexpected var, use let or const instead                no-var
  79:32  warning  Expected '!==' and instead saw '!='                     eqeqeq
  82:11  warning  Unexpected var, use let or const instead                no-var
  83:34  warning  Expected '!==' and instead saw '!='                     eqeqeq
  87:11  warning  Unexpected var, use let or const instead                no-var
  88:16  warning  Unexpected var, use let or const instead                no-var
  89:27  warning  Expected '===' and instead saw '=='                     eqeqeq

✖ 33 problems (0 errors, 33 warnings)

## Priorités du diagnostic
1. **Critique — calcul quadratique des lignes** : pour chaque commande, le code reparcourt toutes les lignes de commande. Ce balayage répété est la cause la plus probable de la lenteur sur 5 000 commandes : son coût croît comme le nombre de commandes multiplié par le nombre total de lignes.
2. **Élevée — recherches répétées des clients** : chaque commande parcourt toute la liste des clients pour retrouver son client, ajoutant un autre coût proportionnel au nombre de commandes et de clients.
3. **Élevée — données chargées sans filtre** : toutes les lignes et tous les clients sont lus, même si l’export concerne une période donnée ; les lignes des commandes annulées sont aussi parcourues avant leur exclusion. Cela amplifie le travail inutile.
4. **Moyenne — traitement difficile à suivre** : `exporterCommandes` cumule accès aux données, calculs et formatage dans des callbacks imbriqués, et sa complexité signalée par ESLint est de 19.
5. **Faible — duplication et conventions vieillissantes** : le formatage HT/TTC est dupliqué et les variables `var` ainsi que les comparaisons `==` nuisent à la cohérence et à la maintenance.