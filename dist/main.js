import { defaultLogger } from './logger.js';
import assert from 'node:assert';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DATABASE } from './database.js';
// pickColumns returns books but with each entry as a subset of Book that only contain columns.
function pickColumns(books, columns) {
    return books.map((book) => {
        const partial = {};
        for (const col of columns) {
            partial[col] = book[col];
        }
        return partial;
    });
}
// isBookKeyArray is a typeguard that ensures that keys is a subset of the properties of Book.
function isBookKeyArray(keys) {
    // Instantiated nonsense because typescript can only validate types at runtime.
    const exampleBook = {
        title: '',
        author: '',
        year: 0,
    };
    const validKeys = Object.keys(exampleBook);
    return keys.every((key) => validKeys.includes(key));
}
// parseQuery takes a basic SQL style query that includes up to SELECT ... FROM ... WHERE ... ORDER BY ... and returns the contents.
// It is neither fast nor extensive. Just having some fun and building empathy for database OSS develoeprs :)
function parseQuery(logger, query) {
    const parser = /^SELECT (.*) FROM [a-z]+(?: WHERE (.*?))?(?: ORDER BY (.*?))?$/;
    const matches = parser.exec(query);
    if (matches === null) {
        throw new Error('null matches');
    }
    const qualifyingRows = [];
    const [, columns, where, orderBy] = matches;
    const cols = columns.split(',').map((c) => c.trim());
    const whereParts = where.split(' AND ');
    // TODO: FROM
    for (const book of DATABASE.library) {
        const rowIsQualifying = rowSatisfiesWhere(logger, { whereParts, book });
        if (!rowIsQualifying) {
            continue;
        }
        qualifyingRows.push(book);
    }
    if (!isBookKeyArray(cols)) {
        if (columns === '*') {
            return qualifyingRows;
        }
        throw new Error(`columns not supported ${cols}`);
    }
    const toReturn = pickColumns(qualifyingRows, cols);
    return order(logger, orderBy, toReturn);
}
// order takes in an orderBy clause and returns sorted rows based on that predicate.
function order(logger, orderBy, rows) {
    const orderByParts = orderBy.split(' ');
    if (orderByParts.length === 0 || orderByParts.length > 2) {
        throw new Error(`Invalid order by clause: ${orderBy}`);
    }
    const orderByColsConcatenated = orderByParts[0];
    const orderByCols = orderByColsConcatenated.split(',').map((c) => c.trim());
    if (!isBookKeyArray(orderByCols)) {
        throw new Error(`Invalid order by clause column ${orderByCols}`);
    }
    return rows.sort((a, b) => {
        for (const orderByCol of orderByCols) {
            const ax = a[orderByCol];
            const bx = b[orderByCol];
            if (ax > bx) {
                logger.debug(`${ax} > ${bx}`);
                return -1;
            }
            else if (ax > bx) {
                logger.debug(`${ax} < ${bx}`);
                return 1;
            }
        }
        logger.debug('a === b');
        return 0;
    });
}
function rowSatisfiesWhere(logger, args) {
    const { book, whereParts } = args;
    logger.debug('processing book', book);
    for (const where of whereParts) {
        logger.debug('processing where', where);
        const column = Object.keys(book).find((colName) => where.startsWith(colName));
        if (column === undefined) {
            throw new Error(`where clause ${where} does not start with a valid column`);
        }
        const afterColumn = where.substring(column.length).trim();
        const operators = ['<', '>', '='];
        const operator = operators.find((op) => afterColumn.startsWith(op));
        if (operator === undefined) {
            throw new Error(`where clause ${afterColumn} does not have a supported operator`);
        }
        const afterOperator = afterColumn.substring(operator.length).trim();
        if (!evaluateWhereOperation(logger, {
            operator,
            book,
            columnName: column,
            afterOperator,
        })) {
            logger.debug(`not satisfied ${operator}, ${JSON.stringify(book)}, ${column}, ${afterOperator}`);
            return false;
        }
    }
    return true;
}
function evaluateWhereOperation(logger, args) {
    const { operator, book, columnName, afterOperator } = args;
    const columnVal = book[columnName];
    switch (operator) {
        case '=':
            switch (typeof columnVal) {
                case 'number':
                    return columnVal === Number(afterOperator);
                case 'string':
                    const trimQuotes = String(afterOperator.substring(1, afterOperator.length - 1));
                    logger.debug(`equality operation: '${columnVal}' vs '${trimQuotes})}'`);
                    return columnVal === trimQuotes;
                default:
                    throw new Error(`error doing operator evaluation for =, type ${typeof columnVal} not supported`);
            }
        case '>':
            return book[columnName] > afterOperator;
        case '<':
            return book[columnName] > afterOperator;
        default:
            throw new Error(`operator ${operator} is not supported`);
    }
}
function runTests() {
    const argv = yargs(hideBin(process.argv))
        .option('logLevel', {
        type: 'string',
        choices: ['info', 'debug'],
        default: 'info',
        description: 'Logging level',
    })
        .parseSync();
    console.log('Command line args:', process.argv);
    console.log('Parsed log level:', argv.logLevel);
    const logger = defaultLogger(argv.logLevel);
    logger.info(`Using log level ${argv.logLevel}`);
    const q = 'SELECT title, author FROM library WHERE year =2006 ORDER BY author,title';
    const parsed = parseQuery(logger, q);
    assert.deepStrictEqual(parsed, [
        {
            author: 'Gene Wolfe',
            title: 'The Book of the New Sun',
        },
        {
            author: 'Thomas Pynchon',
            title: 'Against the Day',
        },
    ]);
}
runTests();
