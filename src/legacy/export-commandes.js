// Export comptable des commandes, lancé chaque nuit par le cabinet comptable.
// Ne pas toucher : ça marche. (JM, 2021)
const TVA = 0.2;
const ENTETE_CSV = 'numero;date;client;ville;nb_lignes;total_ht;total_ttc\n';

function requete(db, sql, params, cb) {
  setImmediate(function () {
    let resultat;
    try {
      const stmt = db.prepare(sql);
      resultat = stmt.all.apply(stmt, params);
    } catch (e) {
      cb(e);
      return;
    }
    cb(null, resultat);
  });
}

function formaterMontant(montant) {
  let montantTxt = String(montant);
  if (montantTxt.indexOf('.') === -1) {
    montantTxt = montantTxt + ',00';
  } else {
    const p = montantTxt.split('.');
    if (p[1].length === 1) {
      p[1] = p[1] + '0';
    }
    montantTxt = p[0] + ',' + p[1];
  }
  return montantTxt;
}

function indexerLignes(lignes) {
  const totauxParCommande = new Map();
  for (const ligne of lignes) {
    let resume = totauxParCommande.get(ligne.commande_id);
    if (!resume) {
      resume = { nb: 0, tot: 0 };
      totauxParCommande.set(ligne.commande_id, resume);
    }
    resume.nb = resume.nb + 1;
    resume.tot = resume.tot + ligne.quantite * ligne.prix_unitaire;
  }
  return totauxParCommande;
}

function indexerClients(clients) {
  const clientsParId = new Map();
  for (const client of clients) {
    clientsParId.set(client.id, client);
  }
  return clientsParId;
}

function formaterChamp(valeur) {
  return valeur.indexOf(';') === -1 ? valeur : valeur.replace(/;/g, ',');
}

function formaterCommande(commande, clientsParId, totauxParCommande) {
  if (commande.statut === 'annulee') {
    return null;
  }
  const client = clientsParId.get(commande.client_id);
  const resume = totauxParCommande.get(commande.id);
  const nb = resume ? resume.nb : 0;
  const tot = resume ? resume.tot : 0;
  const ht = Math.round(tot * 100) / 100;
  const htTxt = formaterMontant(ht);
  const ttc = Math.round(tot * (1 + TVA) * 100) / 100;
  const ttcTxt = formaterMontant(ttc);
  const nom = formaterChamp(client ? client.nom : 'INCONNU');
  const ville = formaterChamp(client ? client.ville : '');
  return commande.id + ';' + commande.date + ';' + nom + ';' + ville + ';'
    + nb + ';' + htTxt + ';' + ttcTxt + '\n';
}

function construireCsv(commandes, clientsParId, totauxParCommande) {
  let csv = ENTETE_CSV;
  const actifs = new Set();
  for (const commande of commandes) {
    const ligneCsv = formaterCommande(commande, clientsParId, totauxParCommande);
    if (ligneCsv === null) {
      continue;
    }
    csv = csv + ligneCsv;
    actifs.add(commande.client_id);
  }
  return csv + '# clients actifs;' + actifs.size + '\n';
}

function chargerClients(db, commandes, totauxParCommande, callback) {
  requete(db, 'SELECT * FROM clients', [], function (err, clients) {
    if (err) {
      callback(err);
      return;
    }
    const clientsParId = indexerClients(clients);
    callback(null, construireCsv(commandes, clientsParId, totauxParCommande));
  });
}

function chargerLignes(db, commandes, callback) {
  requete(db, 'SELECT * FROM lignes_commande', [], function (err, lignes) {
    if (err) {
      callback(err);
      return;
    }
    const totauxParCommande = indexerLignes(lignes);
    chargerClients(db, commandes, totauxParCommande, callback);
  });
}

function exporterCommandes(db, depuis, callback) {
  requete(db, 'SELECT * FROM commandes WHERE date >= ? ORDER BY date, id', [depuis], function (err, commandes) {
    if (err) {
      callback(err);
      return;
    }
    chargerLignes(db, commandes, function (err2, csv) {
      if (err2) {
        callback(err2);
        return;
      }
      callback(null, csv);
    });
  });
}

module.exports = { exporterCommandes: exporterCommandes };
