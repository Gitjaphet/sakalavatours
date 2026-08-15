from fastapi import FastAPI

# `app` est le point d'entrée : c'est cet objet que le serveur va chercher.
app = FastAPI(
    title="Sakalava Tours API",
    description="Premier test — sera remplacé par la vraie application.",
    version="0.0.1",
)


@app.get("/")
def bonjour():
    """Le décorateur dit : sur une requête GET vers "/", exécute cette
    fonction. Le dictionnaire renvoyé devient du JSON automatiquement."""
    return {"message": "Bonjour depuis Sakalava Tours"}


@app.get("/salut/{prenom}")
def saluer(prenom: str):
    """L'annotation `prenom: str` n'est pas décorative : FastAPI s'en sert
    pour valider la requête ET pour générer la documentation."""
    return {"message": f"Salut {prenom}, bienvenue à Nosy Be"}
