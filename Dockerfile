#Stage 1
#ye hamne ek tiyar img he jisme debian , ocaml, or opam he
FROM ocaml/opam:debian-12-ocaml-5.5 AS engine-build 
#workdir andar ek folder banata hai aur uske andar chala jata hai
WORKDIR /home/opam/engine
COPY --chown=opam:opam ocaml-engine/ .
RUN opam install -y dune
RUN opam exec -- dune build --release ./bin/main.exe
#Stage 2
FROM node:24-bookworm-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
# Stage 1 se sirf compiled engine utha ke yahan rakho
COPY --from=engine-build /home/opam/engine/_build/default/bin/main.exe /app/engine/main.exe
ENV ENGINE_PATH=/app/engine/main.exe
ENV NODE_ENV=production
CMD ["npm", "start"]
