# Captures d'Écran pour la Configuration de Cloudflare

Ce document contient des captures d'écran annotées pour guider la configuration de Cloudflare afin d'autoriser les requêtes vers les ressources statiques sous le chemin `/static/*`.

## Accès au Tableau de Bord Cloudflare

![Tableau de bord Cloudflare](https://example.com/images/cloudflare-dashboard.png)

*Figure 1: Page d'accueil du tableau de bord Cloudflare après connexion. Sélectionnez le domaine `longrich.online` dans la liste des sites.*

## Configuration des Règles de Page

### Étape 1: Accéder à la Section Rules

![Menu Rules](https://example.com/images/rules-menu.png)

*Figure 2: Accédez à la section Rules > Page Rules dans le menu latéral.*

### Étape 2: Créer une Nouvelle Règle de Page

![Création de règle de page](https://example.com/images/create-page-rule.png)

*Figure 3: Cliquez sur le bouton "Create Page Rule" pour créer une nouvelle règle.*

### Étape 3: Configurer la Règle de Page

![Configuration de règle de page](https://example.com/images/page-rule-config.png)

*Figure 4: Configurez la règle de page avec le modèle d'URL `*longrich.online/static/*` et les paramètres appropriés.*

### Étape 4: Paramètres de Sécurité

![Paramètres de sécurité](https://example.com/images/security-settings.png)

*Figure 5: Définissez le niveau de sécurité sur "Essentially Off" pour les ressources statiques.*

### Étape 5: Paramètres de Cache

![Paramètres de cache](https://example.com/images/cache-settings.png)

*Figure 6: Configurez les paramètres de cache pour optimiser les performances des ressources statiques.*

## Configuration des Règles de Pare-feu

### Étape 1: Accéder à la Section WAF

![Menu WAF](https://example.com/images/waf-menu.png)

*Figure 7: Accédez à la section Security > WAF dans le menu latéral.*

### Étape 2: Créer une Nouvelle Règle de Pare-feu

![Création de règle de pare-feu](https://example.com/images/create-firewall-rule.png)

*Figure 8: Cliquez sur le bouton "Create Firewall Rule" pour créer une nouvelle règle.*

### Étape 3: Configurer la Règle de Pare-feu

![Configuration de règle de pare-feu](https://example.com/images/firewall-rule-config.png)

*Figure 9: Configurez la règle de pare-feu avec l'expression `(http.request.uri.path contains "/static/")` et l'action "Allow".*

### Étape 4: Définir la Priorité

![Définition de la priorité](https://example.com/images/priority-setting.png)

*Figure 10: Définissez une priorité élevée pour la règle afin qu'elle soit évaluée avant les autres règles.*

## Configuration des Exceptions de Sécurité

### Étape 1: Accéder aux Paramètres de Sécurité

![Menu Paramètres de sécurité](https://example.com/images/security-settings-menu.png)

*Figure 11: Accédez à la section Security > Settings dans le menu latéral.*

### Étape 2: Configurer les Exceptions pour Browser Integrity Check

![Exceptions Browser Integrity Check](https://example.com/images/browser-integrity-exceptions.png)

*Figure 12: Configurez une exception pour le chemin `/static/*` dans les paramètres de Browser Integrity Check.*

## Configuration du Cache

### Étape 1: Accéder aux Paramètres de Cache

![Menu Cache](https://example.com/images/cache-menu.png)

*Figure 13: Accédez à la section Caching > Configuration dans le menu latéral.*

### Étape 2: Configurer les Paramètres Généraux de Cache

![Paramètres généraux de cache](https://example.com/images/general-cache-settings.png)

*Figure 14: Configurez les paramètres généraux de cache pour optimiser les performances.*

### Étape 3: Créer des Règles de Cache Spécifiques

![Règles de cache spécifiques](https://example.com/images/specific-cache-rules.png)

*Figure 15: Créez des règles de cache spécifiques pour les ressources statiques sous `/static/*`.*

## Vérification de la Configuration

### Étape 1: Vérifier les Ressources Statiques dans les Outils de Développement

![Vérification des ressources statiques](https://example.com/images/dev-tools-resources.png)

*Figure 16: Utilisez les outils de développement du navigateur pour vérifier que les ressources statiques sont correctement chargées.*

### Étape 2: Vérifier les En-têtes de Cache

![Vérification des en-têtes de cache](https://example.com/images/cache-headers.png)

*Figure 17: Vérifiez que les en-têtes de cache sont correctement définis pour les ressources statiques.*

### Étape 3: Vérifier les Journaux d'Accès

![Journaux d'accès](https://example.com/images/access-logs.png)

*Figure 18: Consultez les journaux d'accès pour vérifier que les requêtes vers les ressources statiques sont autorisées.*

## Résolution des Problèmes

### Exemple de Problème: Ressources Toujours Bloquées

![Ressources bloquées](https://example.com/images/blocked-resources.png)

*Figure 19: Exemple d'erreur lorsque les ressources sont toujours bloquées malgré la configuration.*

### Solution: Vérification des Règles

![Vérification des règles](https://example.com/images/rules-verification.png)

*Figure 20: Vérifiez que les règles sont correctement configurées et ont une priorité appropriée.*

---

**Note**: Les captures d'écran présentées dans ce document sont des exemples et peuvent différer légèrement de l'interface actuelle de Cloudflare. Veuillez vous référer à la documentation officielle de Cloudflare pour les informations les plus à jour.