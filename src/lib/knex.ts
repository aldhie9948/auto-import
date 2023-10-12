import knex from "knex";

const initKnex = (database: string) =>
  knex({
    client: "mysql",
    connection: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "nkp123",
      database,
    },
  });

export default initKnex;
