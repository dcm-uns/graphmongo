const Express = require("express");
const ExpressGraphQL = require("express-graphql");

// MonGoose es un ORM que nos permite abstraernos de algunos detalles de la base de datos,
// de forma tal de trabajar con el modelo de los datos, que definiremos luego.
const mongoose = require("mongoose");

// Como ofreceremos un endpoint GraphQL, es necesario especificar los esquemas (schemas)
// de nuestros datos. Por esa razón es necesario importar los tipos de datos GraphQL:
const {
	GraphQLID,
	GraphQLString,
	GraphQLList,
	GraphQLType,
	GraphQLSchema,
	GraphQLNonNull,
	GraphQLObjectType
} = require("graphql");

// Creamos la aplicación Express
var app = Express();
var cors = require("cors");
app.use(cors());

mongoose
	.connect("mongodb://127.0.0.1:27017/amigos")
	.then(() => console.log("Connected to database..."))
	.catch(err => console.error(err));

const PersonModel = mongoose.model("person", {
	firstName: String,
	lastName: String
});

const PersonType = new GraphQLObjectType({
	name: "Person",
	fields: {
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString }
	}
});

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "Query",
		fields: {
			// Query 1

			// name of the query, people
			people: {
				 // the type of response this query will return, here PersonType
				type: GraphQLList(PersonType),
				// resolver is required
				resolve: (root, args, context, info) => {
					// we are returning all persons available in the table in mongodb
					return PersonModel.find().exec();
				}
			},
			// Query 2
			peopleByID: {
				// name of the query is people by id
				type: PersonType,
				args: {
					// strong validation for graphqlid, which is mendatory for running this query
					id: { type: GraphQLNonNull(GraphQLID) }
				},
				resolve: (root, args, context, info) => {
					return PersonModel.findById(args.id).exec();
				}
			},
			// Query 3
			peopleByName: {
				type: GraphQLList(PersonType),
				args: { 
					firstName: { type: GraphQLString } 
				},
				resolve: (root, args, context, info) => {
					return PersonModel.find({'firstName':args.firstName}).exec();
				}
			}
		}
	}),

	// Mutation 1
	mutation: new GraphQLObjectType({
		name: "Create",
		fields: {
			people: {
				type: PersonType,
				args: {
					firstName: { type: GraphQLString },
					lastName: { type: GraphQLString }
				},
				resolve: (root, args, context, info) => {
					var people = new PersonModel(args);
					return people.save();
				}
			}
		}
	})
});

app.use("/amigos",	ExpressGraphQL({schema, graphiql: true}));

app.listen(3001, () => {
	console.log("server running at 3001");
});
