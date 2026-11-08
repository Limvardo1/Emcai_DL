# ResumeAI API — Express.js
# Dipakai untuk Hugging Face Space (port 7860) dan tetap kompatibel dengan Render.
FROM node:22-slim

RUN useradd -m -u 1000 user

WORKDIR /app

ENV NODE_ENV=production \
    PORT=7860

COPY --chown=user:user package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=user:user src ./src

USER user

EXPOSE 7860

# PORT dibaca dari env (7860 di HF Space, $PORT di Render).
CMD ["node", "src/index.js"]
