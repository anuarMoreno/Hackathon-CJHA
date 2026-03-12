export const CHARACTERS = [
    {
        id: 'python',
        name: 'Python',
        icon: 'devicon-python-plain',
        color: '#3776ab',
        hp: 120,
        stars: 4.5,
        stats: { speed: 3, power: 4, defense: 3 },
        attacks: [
            { name: 'print()', damageRange: [10, 15] },
            { name: 'lambda', damageRange: [15, 25] },
            { name: 'List Comp', damageRange: [20, 30] },
            { name: 'decorators', damageRange: [12, 22] },
            { name: 'Pip install', damageRange: [18, 35] },
            { name: 'import cursor', damageRange: [30, 45] },
            { name: 'Global Interpreter Lock', damageRange: [25, 40] },
            { name: 'Whitespace Error', damageRange: [40, 60] }
        ]
    },
    {
        id: 'javascript',
        name: 'JavaScript',
        icon: 'devicon-javascript-plain',
        color: '#f7df1e',
        hp: 110,
        stars: 4.0,
        stats: { speed: 5, power: 3, defense: 2 },
        attacks: [
            { name: 'console.log()', damageRange: [8, 12] },
            { name: 'async/await', damageRange: [18, 28] },
            { name: 'Promise.all()', damageRange: [22, 35] },
            { name: 'Closure leak', damageRange: [15, 25] },
            { name: 'NPM install', damageRange: [20, 40] },
            { name: 'Undefined is not a function', damageRange: [35, 50] },
            { name: 'Prototype Chain', damageRange: [28, 42] },
            { name: 'Event Loop Freeze', damageRange: [45, 65] }
        ]
    },
    {
        id: 'java',
        name: 'Java',
        icon: 'devicon-java-plain',
        color: '#b07219',
        hp: 140,
        stars: 3.5,
        stats: { speed: 2, power: 4, defense: 5 },
        attacks: [
            { name: 'System.out.println()', damageRange: [5, 10] },
            { name: 'Maven build', damageRange: [18, 30] },
            { name: 'Generic Type Erasure', damageRange: [22, 35] },
            { name: 'AbstractFactoryProxy', damageRange: [20, 30] },
            { name: 'Garbage Collector', damageRange: [15, 40] },
            { name: 'NullPointerException', damageRange: [40, 60] },
            { name: 'OutOfMemoryError', damageRange: [50, 75] },
            { name: 'Checked Exception', damageRange: [25, 45] }
        ]
    },
    {
        id: 'cpp',
        name: 'C++',
        icon: 'devicon-cplusplus-plain',
        color: '#00599c',
        hp: 150,
        stars: 3.0,
        stats: { speed: 3, power: 5, defense: 4 },
        attacks: [
            { name: 'cout << ', damageRange: [12, 18] },
            { name: 'Manual Memory', damageRange: [20, 35] },
            { name: 'Header hell', damageRange: [15, 25] },
            { name: 'Pointer Magic', damageRange: [25, 40] },
            { name: 'Template Metaprogramming', damageRange: [30, 50] },
            { name: 'Segmentation Fault', damageRange: [45, 70] },
            { name: 'Dangling Reference', damageRange: [35, 55] },
            { name: 'Undefined Behavior', damageRange: [50, 80] }
        ]
    },
    {
        id: 'rust',
        name: 'Rust',
        icon: 'devicon-rust-plain',
        color: '#dea584',
        hp: 130,
        stars: 4.0,
        stats: { speed: 4, power: 4, defense: 5 },
        attacks: [
            { name: 'println!()', damageRange: [10, 15] },
            { name: 'Cargo update', damageRange: [18, 28] },
            { name: 'Safe pointers', damageRange: [12, 20] },
            { name: 'Borrow Checker', damageRange: [25, 35] },
            { name: 'Match Pattern', damageRange: [20, 30] },
            { name: 'Fearless Concurrency', damageRange: [30, 45] },
            { name: 'Unsafe Block', damageRange: [40, 65] },
            { name: 'Trait Bounds', damageRange: [22, 38] }
        ]
    },
    {
        id: 'typescript',
        name: 'TypeScript',
        icon: 'devicon-typescript-plain',
        color: '#3178c6',
        hp: 115,
        stars: 4.5,
        stats: { speed: 4, power: 3, defense: 4 },
        attacks: [
            { name: 'Interface declaration', damageRange: [10, 15] },
            { name: 'Conditional types', damageRange: [22, 35] },
            { name: 'TSC error', damageRange: [18, 28] },
            { name: 'Strict Type Check', damageRange: [20, 30] },
            { name: 'Generics<T>', damageRange: [25, 40] },
            { name: 'Any as unknown', damageRange: [5, 50] },
            { name: 'Type Recursion', damageRange: [30, 45] },
            { name: 'Declaration Merging', damageRange: [28, 42] }
        ]
    },
    {
        id: 'go',
        name: 'Go',
        icon: 'devicon-go-original-wordmark',
        color: '#00add8',
        hp: 125,
        stars: 4.0,
        stats: { speed: 5, power: 3, defense: 3 },
        attacks: [
            { name: 'fmt.Println()', damageRange: [10, 15] },
            { name: 'Struct embedding', damageRange: [12, 22] },
            { name: 'Zero value init', damageRange: [8, 18] },
            { name: 'Goroutine', damageRange: [20, 30] },
            { name: 'Channel Sync', damageRange: [15, 25] },
            { name: 'if err != nil', damageRange: [25, 40] },
            { name: 'Go routine flood', damageRange: [35, 50] },
            { name: 'Type Switch', damageRange: [28, 42] }
        ]
    },
    {
        id: 'kotlin',
        name: 'Kotlin',
        icon: 'devicon-kotlin-plain',
        color: '#a97bff',
        hp: 105,
        stars: 4.5,
        stats: { speed: 4, power: 4, defense: 3 },
        attacks: [
            { name: 'println()', damageRange: [10, 15] },
            { name: 'Data class', damageRange: [12, 22] },
            { name: 'Scope functions', damageRange: [18, 35] },
            { name: 'Null Safety', damageRange: [20, 30] },
            { name: 'Extension Function', damageRange: [15, 25] },
            { name: 'Coroutine', damageRange: [30, 45] },
            { name: 'Sealed Class Match', damageRange: [25, 40] },
            { name: 'Inline function', damageRange: [20, 35] }
        ]
    },
    {
        id: 'swift',
        name: 'Swift',
        icon: 'devicon-swift-plain',
        color: '#ffac45',
        hp: 108,
        stars: 4.5,
        stats: { speed: 4, power: 4, defense: 3 },
        attacks: [
            { name: 'print()', damageRange: [10, 15] },
            { name: 'SwiftUI preview', damageRange: [12, 22] },
            { name: 'ARC management', damageRange: [18, 35] },
            { name: 'Guard let', damageRange: [20, 30] },
            { name: 'Optional Unwrapping', damageRange: [15, 25] },
            { name: 'Protocol Oriented', damageRange: [30, 45] },
            { name: 'Method Swizzling', damageRange: [35, 50] },
            { name: 'Tail Recursion', damageRange: [25, 40] }
        ]
    },
    {
        id: 'ruby',
        name: 'Ruby',
        icon: 'devicon-ruby-plain',
        color: '#701516',
        hp: 100,
        stars: 3.5,
        stats: { speed: 3, power: 3, defense: 2 },
        attacks: [
            { name: 'puts', damageRange: [10, 15] },
            { name: 'Metaprogramming', damageRange: [22, 35] },
            { name: 'Everything is object', damageRange: [12, 22] },
            { name: 'Code Block', damageRange: [20, 30] },
            { name: 'Duck Typing', damageRange: [15, 25] },
            { name: 'Gem install', damageRange: [30, 50] },
            { name: 'Monkey Patching', damageRange: [35, 55] },
            { name: 'Yield control', damageRange: [25, 40] }
        ]
    }
];
