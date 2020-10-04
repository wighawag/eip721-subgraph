# Install

`npm i -D eip721-subgraph`

# use

install `subgraph-deploy`

`npm i -D subgraph-deploy`


in your package.json you can add a script to deploy that subgraph in your running graph-node

```json
{
  "scripts": {
    "deploy:eip721-subgraph": "subgraph-deploy -s wighawag/eip721-subgraph -f eip721-subgraph -i http://localhost:5001/api -g http://localhost:8020"
  }
}
```

# example graphQL query
```
{
  tokens {
    contract
    tokenID
    owner
    tokenURI
  }
}
```


or

```
{
  tokens(orderBy: mintTime) {
    contract
    tokenID
    owner
    tokenURI
    mintTime
  }
  
  tokenContracts {
    id
  }
}
```
