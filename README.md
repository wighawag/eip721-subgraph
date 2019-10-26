## First step, have a ethereum node running
ensure you have ganache running on 8545
```
ganache-cli -h 0.0.0.0
```

## then ensure you have a graph node running
setup a graph-node
```
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
docker-compose up
```

## finally setup your subgraph 

make sure you are in the subgraph repo folder, then
```
yarn
```

and deploy contracts
```
yarn deploy-test-contracts
```

then you can copy the address found in test_deployments.json to use it in subgraph.yaml
```
sed -i -e \
    's/0x2E645469f354BB4F5c8a05B3b30A929361cf77eC/<CONTRACT_ADDRESS>/g' \
    subgraph.yaml
```

then generate code for graph
```
yarn codegen-graph
```

create graph
```
yarn create-local-graph
```

deploy graph
```
yarn deploy-local-graph
```


## To test with a frontend : 

For this, open another terminal. Then, clone an example dApp that is compatible with this subgraph with
```
git clone https://github.com/graphprotocol/ethdenver-dapp/
```
Afterwards, enter the app directory and configure it to use the GraphQL endpoint of your example subgraph:

```
cd ethdenver-dapp
echo 'REACT_APP_GRAPHQL_ENDPOINT=http://localhost:8000/subgraphs/name/<GITHUB_USERNAME>/<SUBGRAPH_NAME>' > .env
```

Finally, install the dApp's dependencies and start it:

```
yarn && yarn start
```