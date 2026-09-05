/**
 * Create or update the Builder.io chronique data model.
 *
 * Usage:
 *   BUILDER_PRIVATE_KEY=bpk-... npm run builder:push:chronique
 *   BUILDER_PRIVATE_KEY=bpk-... npm run builder:push:chronique -- --update
 *   npm run builder:push:chronique -- --dry-run
 */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const MODEL_NAME = 'chronique';
const ADMIN_API_URL = process.env.BUILDER_ADMIN_API_URL || 'https://cdn.builder.io/api/v2/admin';
const privateKey = process.env.BUILDER_PRIVATE_KEY || process.env.BUILDER_PRIVATE_API_KEY;
const shouldUpdate = process.argv.includes('--update');
const dryRun = process.argv.includes('--dry-run');

const modelFields = [
	{
		name: 'title',
		type: 'text',
		required: true,
		helperText: 'Chronique title.'
	},
	{
		name: 'handle',
		type: 'text',
		required: true,
		helperText: 'Unique URL identifier, using lowercase letters, numbers, and hyphens.',
		regex: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
	},
	{
		name: 'excerpt',
		type: 'longText',
		helperText: 'Short editorial summary used on discovery cards.'
	},
	{
		name: 'featuredImage',
		type: 'file',
		allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp', 'svg']
	},
	{
		name: 'date',
		type: 'date'
	},
	{
		name: 'category',
		type: 'text'
	},
	{
		name: 'tags',
		type: 'Tags',
		defaultValue: []
	},
	{
		name: 'readTime',
		type: 'text'
	},
	{
		name: 'author',
		type: 'text'
	},
	{
		name: 'introBlocks',
		type: 'blocks',
		defaultValue: [],
		helperText: 'Builder blocks rendered before the referenced articles.'
	},
	{
		name: 'referencedArticles',
		type: 'list',
		defaultValue: [],
		helperText: 'Ordered references to blog-articles. The order is the reading order.',
		subFields: [
			{
				name: 'article',
				type: 'reference',
				model: 'blog-articles',
				required: true
			},
			{
				name: 'navigationLabel',
				type: 'text',
				helperText: 'Optional label shown in the chronique navigation.'
			}
		]
	},
	{
		name: 'sectionNavigation',
		type: 'object',
		defaultValue: {
			enabled: false,
			title: '',
			description: '',
			sections: []
		},
		subFields: [
			{
				name: 'enabled',
				type: 'boolean',
				defaultValue: false
			},
			{
				name: 'title',
				type: 'text'
			},
			{
				name: 'description',
				type: 'longText'
			},
			{
				name: 'sections',
				type: 'list',
				defaultValue: [],
				subFields: [
					{
						name: 'id',
						type: 'text',
						required: true
					},
					{
						name: 'title',
						type: 'text',
						required: true
					},
					{
						name: 'description',
						type: 'longText'
					}
				]
			}
		]
	}
];

function toGraphQLLiteral(value) {
	if (Array.isArray(value)) {
		return `[${value.map(toGraphQLLiteral).join(',')}]`;
	}

	if (value && typeof value === 'object') {
		return `{${Object.entries(value)
			.map(([key, nestedValue]) => `${key}:${toGraphQLLiteral(nestedValue)}`)
			.join(',')}}`;
	}

	if (typeof value === 'string') {
		return JSON.stringify(value);
	}

	if (typeof value === 'boolean' || typeof value === 'number') {
		return String(value);
	}

	if (value === null) return 'null';

	throw new TypeError(`Unsupported GraphQL value: ${typeof value}`);
}

function addModelMutation() {
	return `mutation AddChroniqueModel { addModel(body: ${toGraphQLLiteral({
		name: MODEL_NAME,
		kind: 'data',
		fields: modelFields
	})}) { id name kind } }`;
}

function updateModelMutation(modelId) {
	return `mutation UpdateChroniqueModel { updateModel(body: ${toGraphQLLiteral({
		id: modelId,
		data: { fields: modelFields }
	})}) { id name kind } }`;
}

async function execute(query) {
	const response = await fetch(ADMIN_API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${privateKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query })
	});

	const payload = await response.json();
	if (!response.ok || payload.errors?.length) {
		const details = payload.errors?.map((error) => error.message).join('; ') || response.statusText;
		throw new Error(`Builder Admin API request failed: ${details}`);
	}

	return payload.data;
}

async function findExistingModel() {
	const data = await execute('query ListModels { models { id name kind } }');
	return data.models?.find((model) => model.name === MODEL_NAME) || null;
}

async function main() {
	if (dryRun) {
		console.log(JSON.stringify({ name: MODEL_NAME, kind: 'data', fields: modelFields }, null, 2));
		return;
	}

	if (!privateKey) {
		throw new Error(
			'BUILDER_PRIVATE_KEY is required. Use a Builder private API key (bpk-...), not the public API key.'
		);
	}

	const existingModel = await findExistingModel();
	if (existingModel && !shouldUpdate) {
		throw new Error(
			`Builder model "${MODEL_NAME}" already exists (${existingModel.id}). Nothing changed. Re-run with --update to replace its fields.`
		);
	}

	const data = await execute(
		existingModel ? updateModelMutation(existingModel.id) : addModelMutation()
	);
	const model = existingModel ? data.updateModel : data.addModel;
	console.log(
		`${existingModel ? 'Updated' : 'Created'} Builder model "${model.name}" (${model.id}) as ${model.kind}.`
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
