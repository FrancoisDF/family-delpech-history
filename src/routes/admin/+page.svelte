<script lang="ts">
	import { onMount } from 'svelte';

	// --- Types ---
	interface SourceDocument {
		id: string;
		title: string;
		author: string | null;
		year: string | null;
		category: string | null;
		tags: string[];
		created_at: string;
	}

	interface BlogPost {
		id: string;
		title: string;
		url: string;
	}

	interface BlogPostRow {
		id: string;
		title: string;
		url: string;
		publishedDate: string | null;
		ingested: boolean;
		ingestedDate: string | null;
		ingestedChunks: number;
		linkedDocuments: number;
	}

	interface DocBlogLink {
		id: string;
		source_document_id: string;
		builder_blog_id: string;
		builder_blog_title: string | null;
		builder_blog_url: string | null;
		created_at: string;
		source_documents: { id: string; title: string } | null;
	}

	interface ImpactPreview {
		chunksCount: number;
		links: { id: string; builder_blog_title: string | null; builder_blog_url: string | null }[];
	}

	interface UnlinkedDoc {
		id: string;
		title: string;
		created_at: string;
	}

	// --- Tab state ---
	let activeTab = $state<'articles' | 'documents' | 'liens'>('articles');

	// --- Shared state ---
	let error = $state('');
	let success = $state('');

	// --- Articles state ---
	let blogPostRows = $state<BlogPostRow[]>([]);
	let orphanedPosts = $state<{ sourceId: string; title: string; chunks: number; ingestedDate: string }[]>([]);
	let isLoadingArticles = $state(true);
	let ingestingIds = $state<Set<string>>(new Set());
	let removingIds = $state<Set<string>>(new Set());

	// --- Documents state ---
	let documents = $state<SourceDocument[]>([]);
	let isLoadingDocs = $state(true);
	let isSubmittingDoc = $state(false);
	let docFormOpen = $state(false);
	let docTitle = $state('');
	let docContent = $state('');
	let docAuthor = $state('');
	let docYear = $state('');
	let docCategory = $state('');
	let docTagsInput = $state('');
	// Upload mode: 'file' | 'paste'
	let uploadMode = $state<'file' | 'paste'>('file');
	let selectedFile = $state<File | null>(null);
	let isDragging = $state(false);
	let uploadProgress = $state<string>('');
	// Delete impact preview
	let deleteTargetDoc = $state<SourceDocument | null>(null);
	let deleteImpact = $state<ImpactPreview | null>(null);
	let isLoadingImpact = $state(false);
	let isDeletingDoc = $state(false);

	// --- Links state ---
	let links = $state<DocBlogLink[]>([]);
	let sourceDocuments = $state<SourceDocument[]>([]);
	let blogPosts = $state<BlogPost[]>([]);
	let isLoadingLinks = $state(true);
	let isSubmittingLink = $state(false);
	let linkFormOpen = $state(false);
	let selectedDocId = $state('');
	let selectedBlogId = $state('');
	let unlinkedDocs = $state<UnlinkedDoc[]>([]);
	let isLoadingUnlinked = $state(true);

	// --- Mobile sidebar ---
	let sidebarOpen = $state(false);

	onMount(() => {
		loadArticles();
		loadDocuments();
		loadLinksData();
		loadUnlinkedDocs();
	});

	// --- Articles functions ---
	async function loadArticles() {
		isLoadingArticles = true;
		try {
			const res = await fetch('/api/admin/blog-posts');
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			blogPostRows = data.posts || [];
			orphanedPosts = data.orphanedPosts || [];
		} catch (err: any) {
			if (!error) error = err.message;
		} finally {
			isLoadingArticles = false;
		}
	}

	async function ingestPost(id: string) {
		ingestingIds = new Set([...ingestingIds, id]);
		error = '';
		success = '';
		try {
			const res = await fetch(`/api/admin/blog-posts/${id}/ingest`, { method: 'POST' });
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			success = `Article ingere: ${data.chunksCreated} chunk(s) cree(s).`;
			await loadArticles();
		} catch (err: any) {
			error = err.message;
		} finally {
			ingestingIds = new Set([...ingestingIds].filter((x) => x !== id));
		}
	}

	async function removeIngestion(id: string) {
		if (!confirm('Retirer cet article de l\'ingestion ?')) return;
		removingIds = new Set([...removingIds, id]);
		error = '';
		success = '';
		try {
			const res = await fetch(`/api/admin/blog-posts/${id}/ingest`, { method: 'DELETE' });
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			success = `Ingestion retiree: ${data.deletedCount} chunk(s) supprime(s).`;
			await loadArticles();
		} catch (err: any) {
			error = err.message;
		} finally {
			removingIds = new Set([...removingIds].filter((x) => x !== id));
		}
	}

	// --- Documents functions ---
	async function loadDocuments() {
		isLoadingDocs = true;
		try {
			const res = await fetch('/api/admin/documents');
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			documents = data.documents || [];
		} catch (err: any) {
			if (!error) error = err.message;
		} finally {
			isLoadingDocs = false;
		}
	}

	const ACCEPTED_EXTENSIONS = '.txt,.pdf,.docx';
	const MAX_FILE_SIZE_CLIENT = 10 * 1024 * 1024; // 10 MB

	function handleFileSelect(file: File) {
		const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
		if (!['.txt', '.pdf', '.docx'].includes(ext)) {
			error = `Type de fichier non supporte (${ext}). Formats acceptes: .txt, .pdf, .docx`;
			return;
		}
		if (file.size > MAX_FILE_SIZE_CLIENT) {
			error = `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum: 10 Mo.`;
			return;
		}
		selectedFile = file;
		error = '';
		if (!docTitle.trim()) {
			docTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) handleFileSelect(file);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	}

	function getFileTypeLabel(name: string): string {
		const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
		switch (ext) {
			case '.txt': return 'Texte brut';
			case '.pdf': return 'PDF';
			case '.docx': return 'Word / Google Docs';
			default: return ext;
		}
	}

	function resetDocForm() {
		docTitle = '';
		docContent = '';
		docAuthor = '';
		docYear = '';
		docCategory = '';
		docTagsInput = '';
		selectedFile = null;
		uploadProgress = '';
	}

	async function handleDocSubmit() {
		if (uploadMode === 'file' && !selectedFile) {
			error = 'Veuillez selectionner un fichier.';
			return;
		}
		if (uploadMode === 'paste' && !docContent.trim()) {
			error = 'Le contenu est requis.';
			return;
		}
		if (!docTitle.trim()) {
			error = 'Le titre est requis.';
			return;
		}

		isSubmittingDoc = true;
		error = '';
		success = '';
		uploadProgress = 'Envoi du fichier...';

		try {
			let res: Response;

			if (uploadMode === 'file' && selectedFile) {
				const formData = new FormData();
				formData.append('file', selectedFile);
				formData.append('title', docTitle.trim());
				if (docAuthor.trim()) formData.append('author', docAuthor.trim());
				if (docYear.trim()) formData.append('year', docYear.trim());
				if (docCategory.trim()) formData.append('category', docCategory.trim());
				if (docTagsInput.trim()) formData.append('tags', docTagsInput.trim());

				uploadProgress = 'Extraction du texte et indexation...';
				res = await fetch('/api/admin/documents', {
					method: 'POST',
					body: formData
				});
			} else {
				const tags = docTagsInput.split(',').map((t) => t.trim()).filter(Boolean);
				uploadProgress = 'Indexation du contenu...';
				res = await fetch('/api/admin/documents', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: docTitle.trim(),
						content: docContent.trim(),
						author: docAuthor.trim() || null,
						year: docYear.trim() || null,
						category: docCategory.trim() || null,
						tags
					})
				});
			}

			if (!res.ok) throw new Error(await res.text());

			const data = await res.json();
			success = `Document "${data.document.title}" cree avec ${data.chunksCreated} chunk(s).`;

			resetDocForm();
			docFormOpen = false;

			await loadDocuments();
			await loadUnlinkedDocs();
			sourceDocuments = documents.map((d) => ({
				id: d.id,
				title: d.title,
				author: null,
				year: null,
				category: null,
				tags: [],
				created_at: d.created_at
			}));
		} catch (err: any) {
			error = err.message;
		} finally {
			isSubmittingDoc = false;
			uploadProgress = '';
		}
	}

	async function openDeletePreview(doc: SourceDocument) {
		deleteTargetDoc = doc;
		deleteImpact = null;
		isLoadingImpact = true;
		try {
			const res = await fetch(`/api/admin/documents/${doc.id}/impact`);
			if (!res.ok) throw new Error(await res.text());
			deleteImpact = await res.json();
		} catch (err: any) {
			error = err.message;
			deleteTargetDoc = null;
		} finally {
			isLoadingImpact = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTargetDoc) return;
		isDeletingDoc = true;
		try {
			const res = await fetch(`/api/admin/documents/${deleteTargetDoc.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error(await res.text());
			success = `Document "${deleteTargetDoc.title}" supprime.`;
			deleteTargetDoc = null;
			deleteImpact = null;
			await Promise.all([loadDocuments(), loadLinksData(), loadUnlinkedDocs()]);
		} catch (err: any) {
			error = err.message;
		} finally {
			isDeletingDoc = false;
		}
	}

	// --- Links functions ---
	async function loadLinksData() {
		isLoadingLinks = true;
		try {
			const [linksRes, docsRes, blogsData] = await Promise.all([
				fetch('/api/admin/links').then(async (r) => {
					if (!r.ok) throw new Error(await r.text());
					return r.json();
				}),
				fetch('/api/admin/documents').then(async (r) => {
					if (!r.ok) throw new Error(await r.text());
					return r.json();
				}),
				fetchBlogPosts()
			]);

			links = linksRes.links || [];
			sourceDocuments = (docsRes.documents || []).map((d: any) => ({ id: d.id, title: d.title }));
			blogPosts = blogsData;
		} catch (err: any) {
			if (!error) error = err.message;
		} finally {
			isLoadingLinks = false;
		}
	}

	async function fetchBlogPosts(): Promise<BlogPost[]> {
		const apiKey = '6c20c92cc5704aba88edd4187fbfd8f0';
		const url = `https://cdn.builder.io/api/v3/content/blog-articles?apiKey=${apiKey}&limit=100&fields=id,data.title,data.handle,data.slug,name`;
		const res = await fetch(url);
		if (!res.ok) throw new Error('Erreur chargement articles');
		const data = await res.json();
		return (data.results || []).map((entry: any) => {
			const entryId = entry.id;
			const title = entry.data?.title || entry.name || 'Sans titre';
			const handle = entry.data?.handle || entry.data?.slug || entryId;
			return { id: entryId, title, url: `/histoires/${handle}` };
		});
	}

	async function createLink() {
		if (!selectedDocId || !selectedBlogId) {
			error = 'Selectionnez un document et un article.';
			return;
		}

		isSubmittingLink = true;
		error = '';
		success = '';

		const blog = blogPosts.find((b) => b.id === selectedBlogId);

		try {
			const res = await fetch('/api/admin/links', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					source_document_id: selectedDocId,
					builder_blog_id: selectedBlogId,
					builder_blog_title: blog?.title || null,
					builder_blog_url: blog?.url || null
				})
			});

			if (!res.ok) throw new Error(await res.text());

			success = 'Lien cree avec succes.';
			selectedDocId = '';
			selectedBlogId = '';
			linkFormOpen = false;
			await Promise.all([loadLinksData(), loadUnlinkedDocs()]);
		} catch (err: any) {
			error = err.message;
		} finally {
			isSubmittingLink = false;
		}
	}

	async function deleteLink(linkId: string) {
		if (!confirm('Supprimer ce lien ?')) return;

		try {
			const res = await fetch(`/api/admin/links/${linkId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error(await res.text());
			success = 'Lien supprime.';
			await Promise.all([loadLinksData(), loadUnlinkedDocs()]);
		} catch (err: any) {
			error = err.message;
		}
	}

	async function loadUnlinkedDocs() {
		isLoadingUnlinked = true;
		try {
			const res = await fetch('/api/admin/links/unlinked');
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			unlinkedDocs = data.documents || [];
		} catch (err: any) {
			if (!error) error = err.message;
		} finally {
			isLoadingUnlinked = false;
		}
	}

	function switchTab(tab: 'articles' | 'documents' | 'liens') {
		activeTab = tab;
		error = '';
		success = '';
		sidebarOpen = false;
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('fr-FR');
	}
</script>

<svelte:head>
	<title>Admin - Console</title>
</svelte:head>

<div class="flex h-screen">
	<!-- Mobile menu button -->
	<button
		onclick={() => (sidebarOpen = !sidebarOpen)}
		class="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md md:hidden"
		aria-label="Menu"
	>
		<svg class="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			{#if sidebarOpen}
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			{:else}
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			{/if}
		</svg>
	</button>

	<!-- Sidebar overlay (mobile) -->
	{#if sidebarOpen}
		<button
			onclick={() => (sidebarOpen = false)}
			class="fixed inset-0 z-30 bg-black/30 md:hidden"
			aria-label="Fermer le menu"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<div class="border-b border-slate-200 px-5 py-4">
			<h2 class="font-serif text-lg font-bold text-slate-900">Admin</h2>
		</div>

		<nav class="flex-1 space-y-1 px-3 py-4">
			<button
				onclick={() => switchTab('articles')}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
				{activeTab === 'articles'
					? 'bg-slate-100 text-slate-900'
					: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
				</svg>
				Articles
			</button>

			<button
				onclick={() => switchTab('documents')}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
				{activeTab === 'documents'
					? 'bg-slate-100 text-slate-900'
					: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Documents
			</button>

			<button
				onclick={() => switchTab('liens')}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
				{activeTab === 'liens'
					? 'bg-slate-100 text-slate-900'
					: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
				</svg>
				Liens
			</button>
		</nav>

		<div class="border-t border-slate-200 px-3 py-4">
			<a
				href="/admin/logout"
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
				</svg>
				Deconnexion
			</a>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Alerts -->
			{#if error}
				<div class="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
					{error}
					<button onclick={() => (error = '')} class="ml-2 font-semibold hover:underline">Fermer</button>
				</div>
			{/if}

			{#if success}
				<div class="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
					{success}
					<button onclick={() => (success = '')} class="ml-2 font-semibold hover:underline">Fermer</button>
				</div>
			{/if}

			<!-- ============================================================ -->
			<!-- ARTICLES PANEL                                                -->
			<!-- ============================================================ -->
			{#if activeTab === 'articles'}
				<div>
					<div class="mb-8">
						<h1 class="font-serif text-3xl font-bold text-slate-900">Articles Builder.io</h1>
						<p class="mt-2 text-slate-600">
							Gerez l'ingestion des articles de blog publies dans Builder.io.
						</p>
					</div>

					<div class="rounded-lg border border-slate-200 bg-white shadow-sm">
						{#if isLoadingArticles}
							<div class="p-6">
								<p class="text-sm text-slate-500">Chargement des articles...</p>
							</div>
						{:else if blogPostRows.length === 0}
							<div class="p-6">
								<p class="text-sm text-slate-500">Aucun article trouve dans Builder.io.</p>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="w-full text-left text-sm">
									<thead class="border-b border-slate-200 bg-slate-50">
										<tr>
											<th class="px-4 py-3 font-semibold text-slate-700">Titre</th>
											<th class="px-4 py-3 font-semibold text-slate-700">Publie le</th>
											<th class="px-4 py-3 font-semibold text-slate-700">Statut</th>
											<th class="px-4 py-3 font-semibold text-slate-700">Ingere le</th>
											<th class="px-4 py-3 font-semibold text-slate-700">Chunks</th>
											<th class="px-4 py-3 font-semibold text-slate-700">Docs lies</th>
											<th class="px-4 py-3 font-semibold text-slate-700">Actions</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-slate-100">
										{#each blogPostRows as post}
											<tr class="hover:bg-slate-50">
												<td class="px-4 py-3">
													<span class="font-medium text-slate-900">{post.title}</span>
												</td>
												<td class="px-4 py-3 text-slate-600">{formatDate(post.publishedDate)}</td>
												<td class="px-4 py-3">
													{#if post.ingested}
														<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
															Ingere
														</span>
													{:else}
														<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
															Non ingere
														</span>
													{/if}
												</td>
												<td class="px-4 py-3 text-slate-600">{formatDate(post.ingestedDate)}</td>
												<td class="px-4 py-3 text-slate-600">{post.ingestedChunks || '—'}</td>
												<td class="px-4 py-3 text-slate-600">
													{#if post.linkedDocuments > 0}
														<span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
															{post.linkedDocuments}
														</span>
													{:else}
														<span class="text-slate-400">0</span>
													{/if}
												</td>
												<td class="px-4 py-3">
													<div class="flex gap-2">
														{#if post.ingested}
															<button
																onclick={() => ingestPost(post.id)}
																disabled={ingestingIds.has(post.id)}
																class="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
															>
																{ingestingIds.has(post.id) ? 'Re-ingestion...' : 'Re-ingerer'}
															</button>
															<button
																onclick={() => removeIngestion(post.id)}
																disabled={removingIds.has(post.id)}
																class="rounded border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
															>
																{removingIds.has(post.id) ? 'Suppression...' : 'Retirer'}
															</button>
														{:else}
															<button
																onclick={() => ingestPost(post.id)}
																disabled={ingestingIds.has(post.id)}
																class="rounded border border-green-300 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
															>
																{ingestingIds.has(post.id) ? 'Ingestion...' : 'Ingerer'}
															</button>
														{/if}
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>

					<!-- Orphaned ingested articles -->
					{#if orphanedPosts.length > 0}
						<div class="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
							<h2 class="mb-1 font-serif text-lg font-bold text-amber-900">
								Articles ingeres mais retires de Builder.io ({orphanedPosts.length})
							</h2>
							<p class="mb-4 text-sm text-amber-700">
								Ces articles ont ete ingeres mais ne sont plus publies dans Builder.io. Leurs chunks restent dans la base de donnees.
							</p>
							<div class="space-y-3">
								{#each orphanedPosts as orphan}
									<div class="flex items-center justify-between rounded-lg bg-white p-4">
										<div>
											<p class="font-medium text-slate-900">{orphan.title}</p>
											<p class="text-xs text-slate-500">
												{orphan.chunks} chunk(s) &middot; Ingere le {formatDate(orphan.ingestedDate)}
											</p>
										</div>
										<button
											onclick={() => removeIngestion(orphan.sourceId)}
											disabled={removingIds.has(orphan.sourceId)}
											class="rounded border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
										>
											{removingIds.has(orphan.sourceId) ? 'Suppression...' : 'Retirer'}
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

			<!-- ============================================================ -->
			<!-- DOCUMENTS PANEL                                               -->
			<!-- ============================================================ -->
			{:else if activeTab === 'documents'}
				<div>
					<div class="mb-8 flex items-start justify-between">
						<div>
							<h1 class="font-serif text-3xl font-bold text-slate-900">Gestion des documents</h1>
							<p class="mt-2 text-slate-600">
								Documents sources (OCR, livres de famille) et leur indexation.
							</p>
						</div>
						<button
							onclick={() => (docFormOpen = !docFormOpen)}
							class="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							{docFormOpen ? 'Fermer' : 'Ajouter un document'}
						</button>
					</div>

					<!-- Collapsible upload form -->
					{#if docFormOpen}
						<div class="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h2 class="mb-4 font-serif text-xl font-bold text-slate-900">Ajouter un document</h2>

							<!-- Mode toggle -->
							<div class="mb-4 flex rounded-lg border border-slate-200 p-0.5">
								<button
									type="button"
									onclick={() => (uploadMode = 'file')}
									class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
									{uploadMode === 'file' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}"
								>
									Importer un fichier
								</button>
								<button
									type="button"
									onclick={() => (uploadMode = 'paste')}
									class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
									{uploadMode === 'paste' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}"
								>
									Coller du texte
								</button>
							</div>

							<form
								onsubmit={(e) => {
									e.preventDefault();
									handleDocSubmit();
								}}
								class="space-y-4"
							>
								{#if uploadMode === 'file'}
									<!-- File upload zone -->
									<div>
										<label class="mb-1 block text-sm font-semibold text-slate-700">
											Fichier (.txt, .pdf, .docx) *
										</label>
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											ondrop={handleDrop}
											ondragover={handleDragOver}
											ondragleave={handleDragLeave}
											class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors
											{isDragging ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400'}"
										>
											{#if selectedFile}
												<div class="flex items-center gap-3">
													<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
														<svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
														</svg>
													</div>
													<div>
														<p class="text-sm font-medium text-slate-900">{selectedFile.name}</p>
														<p class="text-xs text-slate-500">
															{getFileTypeLabel(selectedFile.name)} &middot; {formatFileSize(selectedFile.size)}
														</p>
													</div>
													<button
														type="button"
														onclick={() => (selectedFile = null)}
														class="ml-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
													>
														<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
														</svg>
													</button>
												</div>
											{:else}
												<svg class="mb-2 h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
												</svg>
												<p class="text-sm text-slate-600">
													Glissez un fichier ici ou
													<label class="cursor-pointer font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700">
														parcourez
														<input
															type="file"
															accept={ACCEPTED_EXTENSIONS}
															onchange={(e) => {
																const input = e.currentTarget as HTMLInputElement;
																const file = input.files?.[0];
																if (file) handleFileSelect(file);
															}}
															class="hidden"
														/>
													</label>
												</p>
												<p class="mt-1 text-xs text-slate-400">.txt, .pdf, .docx — 10 Mo max</p>
											{/if}
										</div>
									</div>
								{:else}
									<!-- Paste text zone -->
									<div>
										<label for="doc-content" class="mb-1 block text-sm font-semibold text-slate-700">
											Contenu OCR *
										</label>
										<textarea
											id="doc-content"
											bind:value={docContent}
											placeholder="Collez ici le texte OCR du document..."
											rows="12"
											class="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-700"
										></textarea>
										{#if docContent}
											<p class="mt-1 text-xs text-slate-500">{docContent.length} caracteres</p>
										{/if}
									</div>
								{/if}

								<div>
									<label for="doc-title" class="mb-1 block text-sm font-semibold text-slate-700">
										Titre *
									</label>
									<input
										id="doc-title"
										type="text"
										bind:value={docTitle}
										placeholder="Ex: Livre de famille Dupont - 1920"
										class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
										required
									/>
								</div>

								<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div>
										<label for="doc-author" class="mb-1 block text-sm font-semibold text-slate-700">Auteur</label>
										<input
											id="doc-author"
											type="text"
											bind:value={docAuthor}
											placeholder="Archives familiales"
											class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
										/>
									</div>
									<div>
										<label for="doc-year" class="mb-1 block text-sm font-semibold text-slate-700">Annee</label>
										<input
											id="doc-year"
											type="text"
											bind:value={docYear}
											placeholder="1920"
											class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
										/>
									</div>
									<div>
										<label for="doc-category" class="mb-1 block text-sm font-semibold text-slate-700">Categorie</label>
										<input
											id="doc-category"
											type="text"
											bind:value={docCategory}
											placeholder="Livres de famille"
											class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
										/>
									</div>
								</div>

								<div>
									<label for="doc-tags" class="mb-1 block text-sm font-semibold text-slate-700">
										Tags (separes par des virgules)
									</label>
									<input
										id="doc-tags"
										type="text"
										bind:value={docTagsInput}
										placeholder="genealogie, histoire, XIXe siecle"
										class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
									/>
								</div>

								<!-- Progress indicator -->
								{#if isSubmittingDoc && uploadProgress}
									<div class="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
										<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{uploadProgress}
									</div>
								{/if}

								<button
									type="submit"
									disabled={isSubmittingDoc}
									class="rounded-lg bg-slate-900 px-6 py-2 font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isSubmittingDoc ? 'Traitement en cours...' : 'Ajouter et indexer'}
								</button>
							</form>
						</div>
					{/if}

					<!-- Document list -->
					<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<h2 class="mb-4 font-serif text-xl font-bold text-slate-900">
							Documents existants ({documents.length})
						</h2>

						{#if isLoadingDocs}
							<p class="text-sm text-slate-500">Chargement...</p>
						{:else if documents.length === 0}
							<p class="text-sm text-slate-500">Aucun document source.</p>
						{:else}
							<div class="space-y-3">
								{#each documents as doc}
									<div class="rounded-lg border border-slate-100 p-4">
										<div class="flex items-center justify-between">
											<div>
												<p class="font-semibold text-slate-900">{doc.title}</p>
												<p class="text-xs text-slate-500">
													{#if doc.author}{doc.author} &middot; {/if}
													{#if doc.year}{doc.year} &middot; {/if}
													{#if doc.category}{doc.category} &middot; {/if}
													Ajoute le {formatDate(doc.created_at)}
												</p>
												{#if doc.tags && doc.tags.length > 0}
													<div class="mt-1 flex flex-wrap gap-1">
														{#each doc.tags as tag}
															<span class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tag}</span>
														{/each}
													</div>
												{/if}
											</div>
											<button
												onclick={() => openDeletePreview(doc)}
												class="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
											>
												Supprimer
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Delete impact modal -->
				{#if deleteTargetDoc}
					<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
						<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
							<h3 class="font-serif text-lg font-bold text-slate-900">
								Supprimer "{deleteTargetDoc.title}" ?
							</h3>

							{#if isLoadingImpact}
								<p class="mt-4 text-sm text-slate-500">Calcul de l'impact...</p>
							{:else if deleteImpact}
								<div class="mt-4 space-y-3">
									<div class="rounded-lg bg-red-50 p-3 text-sm text-red-800">
										<p class="font-semibold">Donnees qui seront supprimees :</p>
										<ul class="mt-1 list-inside list-disc">
											<li>{deleteImpact.chunksCount} chunk(s) dans la base vectorielle</li>
											<li>{deleteImpact.links.length} lien(s) document-article</li>
										</ul>
									</div>

									{#if deleteImpact.links.length > 0}
										<div class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
											<p class="font-semibold">Articles de blog qui perdront ce lien :</p>
											<ul class="mt-1 list-inside list-disc">
												{#each deleteImpact.links as link}
													<li>{link.builder_blog_title || link.builder_blog_url || 'Article inconnu'}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/if}

							<div class="mt-6 flex justify-end gap-3">
								<button
									onclick={() => { deleteTargetDoc = null; deleteImpact = null; }}
									class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
								>
									Annuler
								</button>
								<button
									onclick={confirmDelete}
									disabled={isLoadingImpact || isDeletingDoc}
									class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
								>
									{isDeletingDoc ? 'Suppression...' : 'Confirmer la suppression'}
								</button>
							</div>
						</div>
					</div>
				{/if}

			<!-- ============================================================ -->
			<!-- LIENS PANEL                                                   -->
			<!-- ============================================================ -->
			{:else if activeTab === 'liens'}
				<div>
					<div class="mb-8 flex items-start justify-between">
						<div>
							<h1 class="font-serif text-3xl font-bold text-slate-900">Liens document-article</h1>
							<p class="mt-2 text-slate-600">
								Associez des documents sources aux articles de blog.
							</p>
						</div>
						<button
							onclick={() => (linkFormOpen = !linkFormOpen)}
							class="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							{linkFormOpen ? 'Fermer' : 'Creer un lien'}
						</button>
					</div>

					<!-- Collapsible create link form -->
					{#if linkFormOpen}
						<div class="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
							<h2 class="mb-4 font-serif text-xl font-bold text-slate-900">Creer un lien</h2>

							{#if isLoadingLinks}
								<p class="text-sm text-slate-500">Chargement des donnees...</p>
							{:else}
								<form
									onsubmit={(e) => {
										e.preventDefault();
										createLink();
									}}
									class="space-y-4"
								>
									<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div>
											<label for="link-document" class="mb-1 block text-sm font-semibold text-slate-700">
												Document source
											</label>
											<select
												id="link-document"
												bind:value={selectedDocId}
												class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
											>
												<option value="">-- Choisir un document --</option>
												{#each sourceDocuments as doc}
													<option value={doc.id}>{doc.title}</option>
												{/each}
											</select>
											{#if sourceDocuments.length === 0}
												<p class="mt-1 text-xs text-slate-400">
													Aucun document. Ajoutez-en un dans l'onglet Documents.
												</p>
											{/if}
										</div>

										<div>
											<label for="link-blog" class="mb-1 block text-sm font-semibold text-slate-700">
												Article de blog
											</label>
											<select
												id="link-blog"
												bind:value={selectedBlogId}
												class="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 outline-none focus:border-slate-700"
											>
												<option value="">-- Choisir un article --</option>
												{#each blogPosts as blog}
													<option value={blog.id}>{blog.title}</option>
												{/each}
											</select>
										</div>
									</div>

									<button
										type="submit"
										disabled={isSubmittingLink || !selectedDocId || !selectedBlogId}
										class="rounded-lg bg-slate-900 px-6 py-2 font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{isSubmittingLink ? 'Creation...' : 'Creer le lien'}
									</button>
								</form>
							{/if}
						</div>
					{/if}

					<!-- Unlinked documents -->
					{#if !isLoadingUnlinked && unlinkedDocs.length > 0}
						<div class="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
							<h2 class="mb-3 font-serif text-lg font-bold text-amber-900">
								Documents sans lien ({unlinkedDocs.length})
							</h2>
							<p class="mb-3 text-sm text-amber-700">
								Ces documents ne sont lies a aucun article de blog.
							</p>
							<div class="space-y-2">
								{#each unlinkedDocs as doc}
									<div class="flex items-center justify-between rounded-lg bg-white p-3">
										<div>
											<p class="text-sm font-medium text-slate-900">{doc.title}</p>
											<p class="text-xs text-slate-500">Ajoute le {formatDate(doc.created_at)}</p>
										</div>
										<button
											onclick={() => { linkFormOpen = true; selectedDocId = doc.id; }}
											class="rounded border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
										>
											Lier
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Existing links -->
					<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<h2 class="mb-4 font-serif text-xl font-bold text-slate-900">
							Liens existants ({links.length})
						</h2>

						{#if isLoadingLinks}
							<p class="text-sm text-slate-500">Chargement...</p>
						{:else if links.length === 0}
							<p class="text-sm text-slate-500">Aucun lien.</p>
						{:else}
							<div class="space-y-3">
								{#each links as link}
									<div class="flex items-center justify-between rounded-lg border border-slate-100 p-4">
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
													Document
												</span>
												<span class="text-sm text-slate-900">
													{link.source_documents?.title || link.source_document_id}
												</span>
											</div>
											<div class="mt-1 flex items-center gap-2">
												<span class="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
													Article
												</span>
												<span class="text-sm text-slate-900">
													{link.builder_blog_title || link.builder_blog_id}
												</span>
												{#if link.builder_blog_url}
													<a
														href={link.builder_blog_url}
														class="text-xs text-blue-600 hover:underline"
													>
														Voir
													</a>
												{/if}
											</div>
											<p class="mt-1 text-xs text-slate-400">
												Cree le {formatDate(link.created_at)}
											</p>
										</div>
										<button
											onclick={() => deleteLink(link.id)}
											class="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
										>
											Supprimer
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
