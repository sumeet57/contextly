# Contextly

**Context that LLMs love.**

Contextly is an open-source TypeScript library focused on query-aware context retrieval and optimization for Large Language Model (LLM) applications.

The goal is to help developers retrieve relevant information from conversation history and build more efficient context for LLMs.

🌐 Website: [contextly.vercel.app](https://contextly.vercel.app/)

## Features

- **Keyword Retrieval:** Retrieve relevant context chunks using keyword matching.
- **Query Processing:** Analyze queries to identify keywords, intent, and context requirements.
- **TypeScript First:** Built with TypeScript for type safety and developer experience.
- **Modular Architecture:** Designed to support future retrieval strategies, integrations, and optimization techniques.

## Getting Started

### Requirements

- Node.js
- npm

### Development Setup

```bash
git clone https://github.com/sumeet57/contextly.git
cd contextly
npm install
```

### Build

```bash
npm run typecheck
npm run build
```

### Run the Example

```bash
npm run example
```

## Project Structure

```text
contextly/
├── packages/
│   └── core/
│       └── src/
│           ├── query/
│           ├── retrieval/
│           └── index.ts
├── examples/
├── package.json
└── README.md
```

## Roadmap

- [x] Initial TypeScript monorepo setup
- [x] Basic keyword retrieval
- [ ] Automated tests
- [ ] Improved relevance ranking
- [ ] Vector retrieval
- [ ] Hybrid retrieval
- [ ] Context optimization and token budgeting
- [ ] Benchmarks for retrieval quality and token reduction
- [ ] Optional integrations and hosted services

## Open Source

Contextly's core library is intended to remain free and open source. Optional hosted services and advanced features may be offered separately in the future.

## Contributing

Contributions, bug reports, feature suggestions, and feedback are welcome. Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
