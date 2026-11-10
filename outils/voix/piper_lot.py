# Génère un fichier WAV par phrase avec Piper (voix neuronale libre, hors-ligne).
# Appelé par generer.mjs : python piper_lot.py <modele.onnx> <locuteur> <lenteur> <phrases.json> <dossier>
import json
import sys
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

model, speaker, length_scale, phrases_file, out_dir = sys.argv[1:6]
voice = PiperVoice.load(model)
config = SynthesisConfig(speaker_id=int(speaker), length_scale=float(length_scale), noise_scale=0.6, noise_w_scale=0.7)
phrases = json.loads(Path(phrases_file).read_text(encoding="utf-8"))
out = Path(out_dir)
out.mkdir(parents=True, exist_ok=True)

for key, text in phrases.items():
    with wave.open(str(out / f"{key}.wav"), "wb") as wav:
        voice.synthesize_wav(text, wav, syn_config=config)
    print(key, flush=True)
